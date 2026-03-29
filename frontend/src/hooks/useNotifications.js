import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export default function useNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    // Real-time listener on the notifications collection
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Mark a single notification as read
  async function markAsRead(notificationId) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    try {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unread.map((n) =>
          updateDoc(doc(db, 'notifications', n.id), { isRead: true })
        )
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}