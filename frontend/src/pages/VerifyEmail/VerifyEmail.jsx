import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/firebaseConfig';
import { resendVerificationEmail } from '../../api/userApi';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo/Logo';
import { FiMail, FiRefreshCw } from 'react-icons/fi';
import './VerifyEmail.css';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      await resendVerificationEmail();
      setResent(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleContinue() {
    const verified = await refreshUser();
    if (verified) {
      // Keep Firestore's copy in sync — anywhere reading via Firestore
      // (like an admin user list) has no access to the live Firebase Auth
      // flag directly, only the signed-in user's own session does.
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          emailVerified: true,
        });
      } catch (err) {
        console.error('Could not sync verification status:', err);
      }
      navigate('/dashboard', { replace: true });
    } else {
      alert('Please verify your email before continuing.');
    }
  }

  return (
    <div className="verify-page">
      <div className="verify-card">
        <div className="verify-brand" onClick={() => navigate('/')}>
          <Logo size={28} />
          <span>Recova</span>
        </div>
        <div className="verify-icon">
          <FiMail size={32} />
        </div>
        <h2>Verify your email</h2>
        <p>We sent a verification link to <strong>{auth.currentUser?.email}</strong>. Click the link in your email then come back here.</p>

        {resent && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            Verification email resent!
          </div>
        )}

        <button className="btn btn-primary btn-full" onClick={handleContinue}>
          I've verified my email
        </button>

        <button
          className="btn btn-ghost btn-full"
          onClick={handleResend}
          disabled={loading || resent}
          style={{ marginTop: '0.5rem' }}
        >
          <FiRefreshCw size={14} />
          {loading ? 'Sending...' : resent ? 'Email sent' : 'Resend verification email'}
        </button>
      </div>
    </div>
  );
}