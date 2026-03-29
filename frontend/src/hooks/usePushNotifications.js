import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export default function usePushNotifications() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Push notifications not supported');
      return;
    }

    async function setupPushNotifications() {
      try {
        // Request permission first
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied');
          return;
        }

        // Manually register service worker
        const registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' }
        );

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        console.log('Service worker registered:', registration);

        const messaging = getMessaging();

        // Get FCM token using the registered service worker
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            fcmToken: token,
          });
          console.log('FCM token saved:', token.slice(0, 20) + '...');
        } else {
          console.log('No FCM token received');
        }

        // Handle foreground messages
        onMessage(messaging, (payload) => {
          console.log('Foreground message:', payload);
          const { title, body } = payload.notification || {};
          new Notification(title || 'Campus Lost & Found', {
            body: body || 'You have a new notification',
            icon: '/vite.svg',
          });
        });

      } catch (err) {
        console.error('Push notification setup error:', err.message);
      }
    }

    setupPushNotifications();
  }, [currentUser]);
}
