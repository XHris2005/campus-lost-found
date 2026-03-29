import { auth } from '../firebase/firebaseConfig';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Get the current user's auth token
async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

// Report a lost item
export async function reportLostItem(formData) {
  const token = await getToken();
  const response = await fetch(`${BACKEND_URL}/api/items/lost`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData, // FormData object (includes image)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to report lost item');
  }
  return response.json();
}

// Report a found item
export async function reportFoundItem(formData) {
  const token = await getToken();
  const response = await fetch(`${BACKEND_URL}/api/items/found`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to report found item');
  }
  return response.json();
}

// Get all lost items
export async function getLostItems() {
  const token = await getToken();
  const response = await fetch(`${BACKEND_URL}/api/items/lost`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch lost items');
  return response.json();
}

// Get all found items
export async function getFoundItems() {
  const token = await getToken();
  const response = await fetch(`${BACKEND_URL}/api/items/found`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch found items');
  return response.json();
}