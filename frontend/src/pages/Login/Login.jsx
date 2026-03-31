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

export default function Login() {
  const [email, setEmail] = useState('');
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
            <div className="auth-brand-icon">
              <FiSearch size={22} />
            </div>
            <span>CampusFind</span>
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
            <p>Sign in to your CampusFind account</p>
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
          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Create one here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}