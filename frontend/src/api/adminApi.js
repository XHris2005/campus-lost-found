import { auth } from '../firebase/firebaseConfig';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

export async function getMatches() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/admin/matches`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch matches');
  return res.json();
}

export async function updateMatchStatus(matchId, status) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/admin/matches/${matchId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Could not update match');
  return res.json();
}

export async function getStats() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch stats');
  return res.json();
}

export async function getUsers() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch users');
  return res.json();
}

export async function deleteItem(collection, itemId) {
  const token = await getToken();
  const res = await fetch(
    `${BACKEND_URL}/api/admin/items/${collection}/${itemId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error('Could not delete item');
  return res.json();
}