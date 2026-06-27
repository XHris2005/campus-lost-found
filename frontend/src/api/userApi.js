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

// Lecturer registration — called server-side since Firebase Auth user
// is created via Admin SDK (not client SDK) to allow returning the lecturerId
export async function registerLecturer({ name, email, password }) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/register-lecturer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not create lecturer account');
  return data;
}

// Used during LECTURER LOGIN — resolves Lecturer ID or email → email
export async function lookupLecturerEmail(idOrEmail) {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/users/lookup-lecturer/${encodeURIComponent(idOrEmail)}`,
    { method: 'GET' }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not find lecturer account');
  return data;
}