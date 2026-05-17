import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight, FiSearch } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import './Login.css';
import { useAuth } from '../../context/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import Logo from '../../components/Logo/Logo';
import { signInWithGoogle } from '../../api/authApi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
  setGoogleLoading(true);
  setError('');
  try {
    await signInWithGoogle();
    navigate('/dashboard', { replace: true });
  } catch (err) {
    setError('Google sign-in failed. Please try again.');
  }
  setGoogleLoading(false);
}

  async function handlePasswordReset(e) {
    e.preventDefault();
    if (!resetEmail) return;
      setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err) {
      setError('Could not send reset email. Check the address and try again.');
    }
    setResetLoading(false);
  }

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser]);

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand" onClick={() => navigate('/')}>
  <Logo size={30} />
  <span>Recova</span>
</div>
          <div className="auth-left-text">
            <h1>Find What Matters</h1>
            <p>
              AI-powered lost and found platform for the
              University of Calabar community.
            </p>
          </div>
          <div className="auth-features">
            {[
              '🤖 AI-powered item matching',
              '🔔 Real-time notifications',
              '🔒 Secure verification system',
              '💬 Built-in recovery chat',
            ].map((f) => (
              <div key={f} className="auth-feature-item">{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-right-top">
          <button className="auth-theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your Recova account</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <FiArrowRight size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrap">
                <FiMail className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-full"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <FiArrowRight size={16} />}
            </button>
          </form>

              {!showReset ? (
                <p className="forgot-password-link">
                  <button
                    type="button"
                    className="forgot-btn"
                    onClick={() => setShowReset(true)}
                  >
                    Forgot your password?
                  </button>
                </p>
              ) : (
                <div className="reset-form">
                <h3 className="reset-title">Reset Password</h3>
                {resetSent ? (
                  <div className="alert alert-success">
                    ✅ Reset link sent! Check your email inbox.
                  </div>
                  ) : (
                    <form onSubmit={handlePasswordReset} className="auth-form">
                      <div className="form-group">
                        <label className="form-label">Your Email Address</label>
                        <div className="input-icon-wrap">
                          <FiMail className="input-icon" size={16} />
                          <input
                            className="form-input input-with-icon"
                            type="email"
                            placeholder="you@example.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="reset-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowReset(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={resetLoading}
                        >
                          {resetLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                      </div>
                    </form>
                  )}
              </div>
            )}
            <div className="auth-divider">
  <span>or</span>
</div>

<button
  type="button"
  className="btn btn-google"
  onClick={handleGoogleSignIn}
  disabled={googleLoading}
>
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.5 3.1 29.6 1 24 1 14.9 1 7.1 6.7 3.9 14.7l7 5.4C12.5 13.7 17.8 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 6.5-9.4 6.5-16.2z"/>
    <path fill="#FBBC05" d="M10.9 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z"/>
    <path fill="#34A853" d="M24 47c5.6 0 10.3-1.9 13.7-5l-7-5.4c-1.9 1.3-4.3 2-6.7 2-6.2 0-11.5-4.2-13.4-9.9l-7.8 6.1C7.1 41.3 14.9 47 24 47z"/>
  </svg>
  {googleLoading ? 'Signing in...' : 'Continue with Google'}
</button>
          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Create one here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}