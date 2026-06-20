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

// Used during REGISTRATION — rejects if matric number is already claimed
// or not yet activated (placeholder email).
export async function verifyMatricNo(matricNo) {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/users/verify-matric/${encodeURIComponent(matricNo)}`,
    { method: 'GET' }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Matric number not found');
  return data;
}

// Called after successful registration to lock the matric number.
export async function claimMatricNo(matricNo, uid) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/claim-matric`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matricNo, uid }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not claim matric number');
  return data;
}

// Used during LOGIN and PASSWORD RESET — only works if the matric number
// is already claimed (has a real account).
export async function lookupMatricEmail(matricNo) {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/users/lookup-matric/${encodeURIComponent(matricNo)}`,
    { method: 'GET' }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Matric number not found');
  return data;
}