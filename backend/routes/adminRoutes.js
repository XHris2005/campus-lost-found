const { sendPushNotification } = require('../services/notificationService');
const { createChatForMatch } = require('../services/matchingService');
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/authMiddleware');

async function verifyAdmin(req, res, next) {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Access denied — admins only' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Could not verify admin role' });
  }
}

// GET /api/admin/matches — get all matches with item details
router.get('/matches', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const matchesSnapshot = await db
      .collection('matches')
      .orderBy('createdAt', 'desc')
      .get();

    if (matchesSnapshot.empty) return res.json([]);

    const matches = await Promise.all(
      matchesSnapshot.docs.map(async (doc) => {
        const match = { id: doc.id, ...doc.data() };

        const [lostDoc, foundDoc] = await Promise.all([
          db.collection('lostItems').doc(match.lostItemId).get(),
          db.collection('foundItems').doc(match.foundItemId).get(),
        ]);

        return {
          ...match,
          lostItem: lostDoc.exists ? { id: lostDoc.id, ...lostDoc.data() } : null,
          foundItem: foundDoc.exists ? { id: foundDoc.id, ...foundDoc.data() } : null,
        };
      })
    );

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch matches' });
  }
});

// PATCH /api/admin/matches/:matchId — approve or reject a match
router.patch('/matches/:matchId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const matchDoc = await db.collection('matches').doc(matchId).get();
    if (!matchDoc.exists) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchDoc.data();

    await db.collection('matches').doc(matchId).update({
      status,
      reviewedBy: req.user.uid,
      reviewedAt: new Date().toISOString(),
    });

    if (status === 'approved') {
      // Notify lost item owner
      await db.collection('notifications').add({
        userId: match.notifiedUser,
        type: 'match_approved',
        message: 'Great news! Admin has confirmed a match for your lost item.',
        lostItemId: match.lostItemId,
        foundItemId: match.foundItemId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      await sendPushNotification(match.notifiedUser, {
        title: '✅ Match Approved!',
        body: 'An admin has confirmed a match for your lost item. Tap to claim it.',
        type: 'match_approved',
        url: '/listings',
      });

      // Update item statuses
      await db.collection('lostItems').doc(match.lostItemId).update({ status: 'matched' });
      await db.collection('foundItems').doc(match.foundItemId).update({ status: 'matched' });

      // Reject all other pending claims on the same found item
      const otherClaims = await db
        .collection('claims')
        .where('foundItemId', '==', match.foundItemId)
        .where('status', '==', 'pending')
        .get();

      await Promise.all(
        otherClaims.docs
          .filter((doc) => doc.id !== matchId)
          .map(async (doc) => {
            await doc.ref.update({ status: 'rejected' });
            const claimData = doc.data();
            // Update the associated match to rejected too
            if (claimData.matchId) {
              await db.collection('matches').doc(claimData.matchId).update({ status: 'rejected' });
            }
            // Notify the other claimants
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

      // Get owner and finder IDs
      const lostItemDoc = await db.collection('lostItems').doc(match.lostItemId).get();
      const foundItemDoc = await db.collection('foundItems').doc(match.foundItemId).get();
      const ownerId = lostItemDoc.data()?.userId;
      const finderId = foundItemDoc.data()?.userId;

      // Create chat using shared function
      await createChatForMatch(matchId, match.lostItemId, match.foundItemId, ownerId, finderId);
    }

    if (status === 'rejected') {
      await db.collection('notifications').add({
        userId: match.notifiedUser,
        type: 'match_rejected',
        message: 'The potential match for your lost item was reviewed and did not match. We will keep searching.',
        lostItemId: match.lostItemId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ message: `Match ${status} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update match' });
  }
});

// GET /api/admin/stats
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [lostSnap, foundSnap, matchesSnap, usersSnap] = await Promise.all([
      db.collection('lostItems').get(),
      db.collection('foundItems').get(),
      db.collection('matches').get(),
      db.collection('users').get(),
    ]);

    const matches = matchesSnap.docs.map((d) => d.data());

    res.json({
      totalLostItems: lostSnap.size,
      totalFoundItems: foundSnap.size,
      totalMatches: matchesSnap.size,
      pendingMatches: matches.filter((m) => m.status === 'pending').length,
      approvedMatches: matches.filter((m) => m.status === 'approved' || m.status === 'auto_approved').length,
      rejectedMatches: matches.filter((m) => m.status === 'rejected').length,
      totalUsers: usersSnap.size,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch users' });
  }
});

module.exports = router;