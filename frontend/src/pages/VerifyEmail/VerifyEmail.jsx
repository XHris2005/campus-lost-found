import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebaseConfig';
import { sendEmailVerification } from 'firebase/auth';
import { useState } from 'react';
import Logo from '../../components/Logo/Logo';
import { FiMail, FiRefreshCw } from 'react-icons/fi';
import './VerifyEmail.css';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResent(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleContinue() {
    await auth.currentUser?.reload();
    if (auth.currentUser?.emailVerified) {
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