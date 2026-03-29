import { auth } from '../firebase/firebaseConfig';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

export async function getMyChats() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/chats/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch chats');
  return res.json();
}

export async function getAllChats() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/chats/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch chats');
  return res.json();
}

export async function getChatMessages(chatId) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch messages');
  return res.json();
}

export async function sendMessage(chatId, text) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Could not send message');
  return res.json();
}

export async function confirmReturn(chatId) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/confirm`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not confirm');
  return res.json();
}