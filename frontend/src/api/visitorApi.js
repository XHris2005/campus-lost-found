export async function submitVisitorReport(formData) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/visitor/report`, {
    method: 'POST',
    body: formData, // FormData — browser sets the correct multipart Content-Type automatically
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not submit report');
  return data;
}
export async function getVisitorReport(token) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/visitor/report/${token}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load report');
  return data;
}

export async function getVisitorListings(type = 'found') {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/visitor/listings?type=${type}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load listings');
  return data;
}

export async function getVisitorChatToken(token) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/visitor/chat-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not access chat');
  return data;
}

export async function submitVisitorClaim({ token, foundItemId, verificationDetails }) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/visitor/claims/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, foundItemId, verificationDetails }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not submit claim');
  return data;
}