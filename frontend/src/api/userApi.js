// frontend/src/api/userApi.js
import { auth } from '../firebase/firebaseConfig';

export async function deleteMyAccount() {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not delete account');
  return res.json();
}