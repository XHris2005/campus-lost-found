importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// This config is duplicated here because service workers
// cannot access Vite environment variables
const firebaseConfig = {
  apiKey: "AIzaSyAKVs_DkZGaIy_BoZW1RVmUx-_wX6VcqCE",
  authDomain: "campus-lost-and-found-50983.firebaseapp.com",
  projectId: "campus-lost-and-found-50983",
  messagingSenderId: "967083775272",
  appId: "1:967083775272:web:eb19e9d75f5412788e6c1d",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'Campus Lost & Found', {
    body: body || 'You have a new notification',
    icon: icon || '/vite.svg',
    badge: '/vite.svg',
    tag: payload.data?.type || 'default',
    data: payload.data,
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});