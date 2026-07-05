const { sendPushNotification } = require('../services/notificationService');
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/authMiddleware');
const sanitize = require('../utils/sanitize');

// GET /api/claims/my — get current user's claims
router.get('/my', verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection('claims')
      .where('claimantId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const claims = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(claims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch claims' });
  }
});

// GET /api/claims — get all claims (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Admins only' });
    }

    const snapshot = await db
      .collection('claims')
      .orderBy('createdAt', 'desc')
      .get();

    const claims = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const claim = { id: doc.id, ...doc.data() };

        const lostDoc = await db
          .collection('lostItems')
          .doc(claim.lostItemId)
          .get();

        return {
          ...claim,
          lostItem: lostDoc.exists
            ? { id: lostDoc.id, ...lostDoc.data() }
            : null,
        };
      })
    );

    res.json(claims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch claims' });
  }
});

// PATCH /api/claims/:claimId — process a claim (admin only)
router.patch('/:claimId', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Admins only' });
    }

    const { claimId } = req.params;
    const { status } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be verified or rejected' });
    }

    const claimDoc = await db.collection('claims').doc(claimId).get();
    if (!claimDoc.exists) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claim = claimDoc.data();

    await db.collection('claims').doc(claimId).update({
      status,
      processedBy: req.user.uid,
      processedAt: new Date().toISOString(),
    });

    if (status === 'verified') {
      await db.collection('lostItems').doc(claim.lostItemId).update({ status: 'recovered' });
      await db.collection('foundItems').doc(claim.foundItemId).update({ status: 'recovered' });

      const foundItemDoc = await db.collection('foundItems').doc(claim.foundItemId).get();
      if (foundItemDoc.exists) {
        const finderId = foundItemDoc.data()?.userId;
        if (finderId) {
          const finderRef = db.collection('users').doc(finderId);
          const finderDoc = await finderRef.get();
          const currentCount = finderDoc.data()?.recoveredCount || 0;
          await finderRef.update({ recoveredCount: currentCount + 1 });
          console.log('Updated recovered count to:', currentCount + 1);
        }
      }

      await db.collection('notifications').add({
        userId: claim.claimantId,
        type: 'claim_verified',
        message: 'Your claim has been verified! Please visit the Lost & Found office with your ID to collect your item.',
        claimId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      await sendPushNotification(claim.claimantId, {
        title: '🎉 Claim Verified!',
        body: 'Your ownership has been verified. Visit the office to collect your item.',
        type: 'claim_verified',
        url: '/dashboard',
      });

      // Reject all other pending claims on the same found item
      const otherClaims = await db
        .collection('claims')
        .where('foundItemId', '==', claim.foundItemId)
        .where('status', '==', 'pending')
        .get();

      await Promise.all(
        otherClaims.docs
          .filter((doc) => doc.id !== claimId)
          .map(async (doc) => {
            await doc.ref.update({ status: 'rejected' });
            const claimData = doc.data();
            if (claimData.matchId) {
              await db.collection('matches').doc(claimData.matchId).update({ status: 'rejected' });
            }
            await db.collection('notifications').add({
              userId: claimData.claimantId,
              type: 'claim_rejected',
              message: 'Another claimant was verified as the owner of the found item you claimed. We will keep looking for your lost item.',
              claimId: doc.id,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          })
      );
    }

    if (status === 'rejected') {
      await db.collection('lostItems').doc(claim.lostItemId).update({ status: 'active' });

      await db.collection('notifications').add({
        userId: claim.claimantId,
        type: 'claim_rejected',
        message: 'Your claim could not be verified. Please contact the Lost & Found office for assistance.',
        claimId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ message: `Claim ${status} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not process claim' });
  }
});

// GET /api/claims/my-matches — get all matches for the current user's lost items
router.get('/my-matches', verifyToken, async (req, res) => {
  try {
    const matchSnapshot = await db
      .collection('matches')
      .where('lostUserId', '==', req.user.uid)
      .get();

    const matches = matchSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch matches' });
  }
});

// POST /api/claims/manual — user manually claims a found item
router.post('/manual', verifyToken, async (req, res) => {
  try {
    const { foundItemId, lostItemId, verificationDetails } = req.body;

    if (!foundItemId || !lostItemId || !verificationDetails) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (verificationDetails.trim().length < 20) {
      return res.status(400).json({ error: 'Verification details must be at least 20 characters.' });
    }

    const foundItemDoc = await db.collection('foundItems').doc(foundItemId).get();
    if (!foundItemDoc.exists) {
      return res.status(404).json({ error: 'Found item not found.' });
    }
    if (foundItemDoc.data().userId === req.user.uid) {
      return res.status(403).json({ error: 'You cannot claim an item you reported as found.' });
    }

    const lostItemDoc = await db.collection('lostItems').doc(lostItemId).get();
    if (!lostItemDoc.exists) {
      return res.status(404).json({ error: 'Lost item not found.' });
    }
    if (lostItemDoc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only claim using your own lost item reports.' });
    }

    const existingActiveMatch = await db
      .collection('matches')
      .where('foundItemId', '==', foundItemId)
      .where('status', 'in', ['approved', 'auto_approved', 'pending'])
      .get();

    if (!existingActiveMatch.empty) {
      return res.status(409).json({
        error: 'This item already has an active or approved match and cannot be claimed right now.',
      });
    }

    const existingClaim = await db
      .collection('claims')
      .where('foundItemId', '==', foundItemId)
      .where('claimantId', '==', req.user.uid)
      .where('status', '==', 'pending')
      .get();

    if (!existingClaim.empty) {
      return res.status(400).json({ error: 'You have already submitted a claim for this item.' });
    }

    const lostItem = { id: lostItemDoc.id, ...lostItemDoc.data() };
    const foundItem = { id: foundItemDoc.id, ...foundItemDoc.data() };

    let combinedScore = 0;
    if (lostItem.imageEmbedding && foundItem.imageEmbedding) {
      const { computeScore } = require('../services/matchingService');
      combinedScore = computeScore(lostItem, foundItem);
    }

    const foundUserId = foundItemDoc.data().userId;

    const matchRef = await db.collection('matches').add({
      lostItemId,
      foundItemId,
      lostUserId: req.user.uid,
      foundUserId,
      combinedScore,
      status: 'pending',
      source: 'manual_claim',
      notifiedUser: req.user.uid,
      createdAt: new Date().toISOString(),
    });

    const claimRef = await db.collection('claims').add({
      matchId: matchRef.id,
      lostItemId,
      foundItemId,
      claimantId: req.user.uid,
      claimantEmail: req.user.email,
      verificationDetails: verificationDetails.trim(),
      status: 'pending',
      source: 'manual_claim',
      createdAt: new Date().toISOString(),
    });

    const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    await Promise.all(
      adminsSnapshot.docs.map((adminDoc) =>
        db.collection('notifications').add({
          userId: adminDoc.id,
          type: 'manual_claim_submitted',
          message: `A user has manually claimed a found item. AI similarity score: ${Math.round(combinedScore * 100)}%. Review required.`,
          claimId: claimRef.id,
          matchId: matchRef.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      )
    );

    res.status(201).json({
      message: 'Claim submitted successfully. An admin will review it shortly.',
      claimId: claimRef.id,
      matchId: matchRef.id,
      aiScore: Math.round(combinedScore * 100),
    });
  } catch (err) {
    console.error('Manual claim error:', err);
    res.status(500).json({ error: 'Could not submit claim.' });
  }
});

module.exports = router;