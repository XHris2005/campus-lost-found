import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/firebaseConfig';

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if user doc already exists
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  // If first time — create Firestore document
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: 'user',
      recoveredCount: 0,
      createdAt: new Date().toISOString(),
    });
  }

  return user;
}