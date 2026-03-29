const { sendPushNotification } = require('../services/notificationService');
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/chats/my — get chats for current user
router.get('/my', verifyToken, async (req, res) => {
  try {
    const [ownerChats, finderChats] = await Promise.all([
      db.collection('chats')
        .where('ownerId', '==', req.user.uid)
        .where('status', '==', 'active')
        .get(),
      db.collection('chats')
        .where('finderId', '==', req.user.uid)
        .where('status', '==', 'active')
        .get(),
    ]);

    const chats = [
      ...ownerChats.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ...finderChats.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    ];

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch chats' });
  }
});

// GET /api/chats/all — get all chats (admin only)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Admins only' });
    }

    const snapshot = await db
      .collection('chats')
      .orderBy('createdAt', 'desc')
      .get();

    const chats = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const chat = { id: doc.id, ...doc.data() };

        // Get last message
        const messagesSnap = await db
          .collection('chats')
          .doc(doc.id)
          .collection('messages')
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        chat.lastMessage = messagesSnap.empty
          ? null
          : messagesSnap.docs[0].data();

        return chat;
      })
    );

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch chats' });
  }
});

// GET /api/chats/:chatId/messages — get messages for a chat
router.get('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify user is part of this chat or is admin
    const chatDoc = await db.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = chatDoc.data();
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const isAdmin = userDoc.data()?.role === 'admin';
    const isParticipant =
      chat.ownerId === req.user.uid || chat.finderId === req.user.uid;

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messagesSnap = await db
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();

    const messages = messagesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ chat: { id: chatDoc.id, ...chat }, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch messages' });
  }
});

// POST /api/chats/:chatId/messages — send a message
router.post('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const chatDoc = await db.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = chatDoc.data();
    if (chat.status === 'completed') {
      return res.status(400).json({ error: 'Chat has been completed' });
    }

    const isParticipant =
      chat.ownerId === req.user.uid || chat.finderId === req.user.uid;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get user's display name
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const senderName = userDoc.data()?.displayName || 'User';

    const messageRef = await db
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        senderId: req.user.uid,
        senderName,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      });
      // Send push to the other participant
        const recipientId =
        req.user.uid === chat.ownerId ? chat.finderId : chat.ownerId;

        await sendPushNotification(recipientId, {
        title: `💬 New Message from ${senderName}`,
        body: text.trim().slice(0, 100),
        type: 'new_message',
        url: `/chat/${chatId}`,
        });

    res.status(201).json({ messageId: messageRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not send message' });
  }
});

// PATCH /api/chats/:chatId/confirm — confirm item returned
router.patch('/:chatId/confirm', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chatDoc = await db.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = chatDoc.data();
    const isOwner = chat.ownerId === req.user.uid;
    const isFinder = chat.finderId === req.user.uid;

    if (!isOwner && !isFinder) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update the appropriate confirmation field
    const updateData = {};
    if (isOwner) updateData.ownerConfirmed = true;
    if (isFinder) updateData.finderConfirmed = true;

    await db.collection('chats').doc(chatId).update(updateData);

    // Check updated state
    const updatedChat = {
      ...chat,
      ...updateData,
    };

    // If both confirmed — complete and clean up the chat
    if (updatedChat.ownerConfirmed && updatedChat.finderConfirmed) {
      // Send system message
      await db
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add({
          senderId: 'system',
          senderName: 'System',
          text: '✅ Both parties have confirmed the item has been returned. This chat will now be closed.',
          createdAt: new Date().toISOString(),
        });

      // Mark chat as completed
      await db.collection('chats').doc(chatId).update({
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      // Notify both parties
      await Promise.all([
        db.collection('notifications').add({
          userId: chat.ownerId,
          type: 'chat_completed',
          message: 'Item return confirmed by both parties. The chat has been closed.',
          isRead: false,
          createdAt: new Date().toISOString(),
        }),
        db.collection('notifications').add({
          userId: chat.finderId,
          type: 'chat_completed',
          message: 'Item return confirmed by both parties. Thank you for helping reunite this item!',
          isRead: false,
          createdAt: new Date().toISOString(),
        }),
      ]);

      await Promise.all([
        sendPushNotification(chat.ownerId, {
            title: '✅ Item Return Complete!',
            body: 'Both parties confirmed. The item has been successfully returned.',
            type: 'chat_completed',
            url: '/dashboard',
        }),
        sendPushNotification(chat.finderId, {
            title: '✅ Item Return Complete!',
            body: 'Thank you for helping reunite this item with its owner!',
            type: 'chat_completed',
            url: '/dashboard',
        }),
    ]);

      return res.json({ message: 'Both confirmed — chat completed', completed: true });
    }

    res.json({
      message: 'Confirmation recorded — waiting for other party',
      completed: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not confirm' });
  }
});

module.exports = router;