const { sendPushNotification } = require('../services/notificationService');
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/authMiddleware');
const sanitize = require('../utils/sanitize'); // add this import

// POST /api/claims — submit a claim for an approved match
router.post('/', verifyToken, async (req, res) => {
  try {
    const { matchId, lostItemId, foundItemId } = req.body;
const verificationDetails = sanitize(req.body.verificationDetails);
    if (!matchId || !lostItemId || !verificationDetails) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify the match exists and is approved
    const matchDoc = await db.collection('matches').doc(matchId).get();
    if (!matchDoc.exists) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchDoc.data();
    if (match.status !== 'approved') {
      return res.status(400).json({ error: 'Can only claim approved matches' });
    }

    // Check match belongs to this user
    if (match.notifiedUser !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized — not your match' });
    }

    // Check if claim already exists
    const existingClaim = await db
      .collection('claims')
      .where('matchId', '==', matchId)
      .where('claimantId', '==', req.user.uid)
      .get();

    if (!existingClaim.empty) {
      return res.status(400).json({ error: 'You have already submitted a claim for this match' });
    }

    // Create the claim
    const claimRef = await db.collection('claims').add({
      matchId,
      lostItemId,
      foundItemId,
      claimantId: req.user.uid,
      claimantEmail: req.user.email,
      verificationDetails,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Notify admins — get all admin users
    const adminsSnapshot = await db
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    await Promise.all(
      adminsSnapshot.docs.map((adminDoc) =>
        db.collection('notifications').add({
          userId: adminDoc.id,
          type: 'claim_submitted',
          message: `A user has submitted a claim and is awaiting verification.`,
          claimId: claimRef.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      )
    );

    res.status(201).json({
      message: 'Claim submitted successfully',
      claimId: claimRef.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not submit claim' });
  }
});

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
    // Verify admin
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
    // Verify admin
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Admins only' });
    }

    const { claimId } = req.params;
    const { status } = req.body; // 'verified' or 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be verified or rejected' });
    }

    const claimDoc = await db.collection('claims').doc(claimId).get();
    if (!claimDoc.exists) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claim = claimDoc.data();

    // Update claim status
    await db.collection('claims').doc(claimId).update({
      status,
      processedBy: req.user.uid,
      processedAt: new Date().toISOString(),
    });

    if (status === 'verified') {
      // Mark lost item as recovered
      await db.collection('lostItems').doc(claim.lostItemId).update({
        status: 'recovered',
      });

      // Mark found item as recovered
      await db.collection('foundItems').doc(claim.foundItemId).update({
        status: 'recovered',
      });

      const foundItemDoc = await db
        .collection('foundItems')
        .doc(claim.foundItemId)
        .get();

      if (foundItemDoc.exists) {
        const finderId = foundItemDoc.data()?.userId;
        if (finderId) {
          const finderRef = db.collection('users').doc(finderId);
          const finderDoc = await finderRef.get();
          const currentCount = finderDoc.data()?.recoveredCount || 0;
          await finderRef.update({
            recoveredCount: currentCount + 1,
          });
          console.log('Updated recovered count to:', currentCount + 1);
        }
      }


      // Notify the claimant
      await db.collection('notifications').add({
        userId: claim.claimantId,
        type: 'claim_verified',
        message: 'Your claim has been verified! Please visit the Lost & Found office with your ID to collect your item.',
        claimId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // After verified notification
      await sendPushNotification(claim.claimantId, {
        title: '🎉 Claim Verified!',
        body: 'Your ownership has been verified. Visit the office to collect your item.',
        type: 'claim_verified',
        url: '/dashboard',
      });
    }

    if (status === 'rejected') {
      // Revert items back to active
      await db.collection('lostItems').doc(claim.lostItemId).update({
        status: 'active',
      });

      // Notify the claimant
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
// GET /api/claims/match/:lostItemId — get approved match for a lost item
router.get('/match/:lostItemId', verifyToken, async (req, res) => {
  try {
    const { lostItemId } = req.params;

    const matchSnapshot = await db
      .collection('matches')
      .where('lostItemId', '==', lostItemId)
      .where('status', '==', 'approved')
      .get();

    if (matchSnapshot.empty) {
      return res.status(404).json({ error: 'No approved match found' });
    }

    const matchDoc = matchSnapshot.docs[0];
    res.json({ id: matchDoc.id, ...matchDoc.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch match' });
  }
});

module.exports = router;