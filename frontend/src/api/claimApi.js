import { auth } from '../firebase/firebaseConfig';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

export async function getMyClaims() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/claims/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch claims');
  return res.json();
}

export async function getAllClaims() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/claims`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch claims');
  return res.json();
}

export async function processClaim(claimId, status) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/claims/${claimId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Could not process claim');
  return res.json();
}

export async function getMyMatches() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/claims/my-matches`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch matches');
  return data;
}

export async function submitManualClaim({ foundItemId, lostItemId, verificationDetails }) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/claims/manual`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ foundItemId, lostItemId, verificationDetails }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not submit claim');
  return data;
}