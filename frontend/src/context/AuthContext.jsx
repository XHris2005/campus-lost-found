import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
        }
        setCurrentUser(user);
        setEmailVerified(user.emailVerified);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Firebase mutates auth.currentUser in place on .reload(), so React never
  // sees a new reference and won't re-render on its own. Call this after
  // reload() to sync the live emailVerified flag into real React state —
  // returns the fresh value so the caller can act on it immediately too.
  async function refreshUser() {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    setEmailVerified(verified);
    return verified;
  }

  const value = { currentUser, userRole, loading, emailVerified, refreshUser };

  // Show a clean loading screen instead of blocking all children
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f4f8',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #1a1a2e',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}