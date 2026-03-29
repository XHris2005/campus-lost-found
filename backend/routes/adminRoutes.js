const { sendPushNotification } = require('../services/notificationService');
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware to verify admin role
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

// GET /api/admin/matches — get all pending matches with item details
router.get('/matches', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const matchesSnapshot = await db
      .collection('matches')
      .orderBy('createdAt', 'desc')
      .get();

    if (matchesSnapshot.empty) {
      return res.json([]);
    }

    // Fetch full item details for each match
    const matches = await Promise.all(
      matchesSnapshot.docs.map(async (doc) => {
        const match = { id: doc.id, ...doc.data() };

        const [lostDoc, foundDoc] = await Promise.all([
          db.collection('lostItems').doc(match.lostItemId).get(),
          db.collection('foundItems').doc(match.foundItemId).get(),
        ]);

        return {
          ...match,
          lostItem: lostDoc.exists
            ? { id: lostDoc.id, ...lostDoc.data() }
            : null,
          foundItem: foundDoc.exists
            ? { id: foundDoc.id, ...foundDoc.data() }
            : null,
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

    // Update match status
    await db.collection('matches').doc(matchId).update({
      status,
      reviewedBy: req.user.uid,
      reviewedAt: new Date().toISOString(),
    });

    if (status === 'approved') {
      // 1. In-app notification to owner
      await db.collection('notifications').add({
        userId: match.notifiedUser,
        type: 'match_approved',
        message: 'Great news! Admin has confirmed a match for your lost item. Please visit the Lost & Found office to claim it.',
        lostItemId: match.lostItemId,
        foundItemId: match.foundItemId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // 2. Push notification to owner
      await sendPushNotification(match.notifiedUser, {
        title: '✅ Match Approved!',
        body: 'An admin has confirmed a match for your lost item. Tap to claim it.',
        type: 'match_approved',
        url: '/listings',
      });

      // 3. Update item statuses
      await db.collection('lostItems').doc(match.lostItemId).update({
        status: 'matched',
      });
      await db.collection('foundItems').doc(match.foundItemId).update({
        status: 'matched',
      });

      // 4. Get owner and finder IDs
      const lostItemDoc = await db.collection('lostItems').doc(match.lostItemId).get();
      const foundItemDoc = await db.collection('foundItems').doc(match.foundItemId).get();
      const ownerId = lostItemDoc.data()?.userId;
      const finderId = foundItemDoc.data()?.userId;

      // 5. Create chat room
      if (ownerId && finderId && ownerId !== finderId) {
        const chatRef = await db.collection('chats').add({
          matchId,
          lostItemId: match.lostItemId,
          foundItemId: match.foundItemId,
          ownerId,
          finderId,
          ownerConfirmed: false,
          finderConfirmed: false,
          status: 'active',
          createdAt: new Date().toISOString(),
        });

        // 6. Send welcome system message
        await db.collection('chats').doc(chatRef.id).collection('messages').add({
          senderId: 'system',
          senderName: 'System',
          text: '👋 A match has been confirmed! Use this chat to arrange a meeting place to return the item. Once the item has been returned, both parties must confirm below.',
          createdAt: new Date().toISOString(),
        });

        // 7. In-app notifications for chat
        await db.collection('notifications').add({
          userId: ownerId,
          type: 'chat_created',
          message: 'A chat room has been created for you to arrange collection of your item!',
          chatId: chatRef.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
        await db.collection('notifications').add({
          userId: finderId,
          type: 'chat_created',
          message: 'A chat room has been created to arrange return of the found item!',
          chatId: chatRef.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        // 8. Push notifications for chat
        await sendPushNotification(ownerId, {
          title: '💬 Chat Room Created!',
          body: 'A chat has been set up to arrange collection of your item.',
          type: 'chat_created',
          url: `/chat/${chatRef.id}`,
        });
        await sendPushNotification(finderId, {
          title: '💬 Chat Room Created!',
          body: 'A chat has been set up to arrange return of the found item.',
          type: 'chat_created',
          url: `/chat/${chatRef.id}`,
        });
      }
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

// GET /api/admin/stats — platform statistics
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
      approvedMatches: matches.filter((m) => m.status === 'approved').length,
      rejectedMatches: matches.filter((m) => m.status === 'rejected').length,
      totalUsers: usersSnap.size,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch stats' });
  }
});

// GET /api/admin/users — get all users
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch users' });
  }
});

module.exports = router;