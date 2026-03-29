const { admin, db } = require('../config/firebase');

// Send a push notification to a specific user
async function sendPushNotification(userId, { title, body, type, url }) {
  try {
    // Get user's FCM token from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) {
      console.log(`No FCM token for user ${userId}`);
      return;
    }

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: { type: type || 'general', url: url || '/dashboard' },
      webpush: {
        notification: {
          title,
          body,
          icon: '/vite.svg',
          badge: '/vite.svg',
          requireInteraction: true,
        },
        fcmOptions: {
          link: url || '/dashboard',
        },
      },
    };

    await admin.messaging().send(message);
    console.log(`Push notification sent to user ${userId}`);
  } catch (err) {
    // Don't crash if push fails — in-app notification still works
    console.error('Push notification error:', err.message);
  }
}

module.exports = { sendPushNotification };