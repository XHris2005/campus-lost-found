import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { FiLock, FiArrowRight, FiMail, FiUser, FiSun, FiMoon, FiEye, FiEyeOff } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo/Logo';
import { lookupMatricEmail } from '../../api/userApi';
import './Login.css';

export default function Login() {
  const [matricNo, setMatricNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLookupLoading, setResetLookupLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser]);

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { email } = await lookupMatricEmail(matricNo);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Invalid matric number or password. Please try again.');
      setLoading(false);
    }
  }

  async function handleShowReset() {
    if (!matricNo.trim()) {
      setError('Please enter your matric number first.');
      return;
    }
    setError('');
    setResetLookupLoading(true);
    try {
      const { email } = await lookupMatricEmail(matricNo);
      setResetEmail(email);
      setShowReset(true);
    } catch (err) {
      setError(err.message || 'Could not find an account for this matric number.');
    }
    setResetLookupLoading(false);
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err) {
      setError('Could not send reset email. Please try again.');
    }
    setResetLoading(false);
  }

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
            <p>AI-powered lost and found platform for the University of Calabar community.</p>
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
              <label className="form-label">Matric Number</label>
              <div className="input-icon-wrap">
                <FiUser className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="text"
                  placeholder="e.g. 20/097344060"
                  value={matricNo}
                  onChange={(e) => setMatricNo(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group" >
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
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
                onClick={handleShowReset}
                disabled={resetLookupLoading}
              >
                {resetLookupLoading ? 'Looking up...' : 'Forgot your password?'}
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
                    <label className="form-label">Reset link will be sent to</label>
                    <div className="input-icon-wrap">
                      <FiMail className="input-icon" size={16} />
                      <input
                        className="form-input input-with-icon"
                        type="email"
                        value={resetEmail}
                        disabled
                        readOnly
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
          <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
  Lecturer?{' '}
  <Link to="/lecturer-login">Lecturer login</Link>
</p>
 <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
            Business owner?{' '}
            <Link to="/business-login">Business login</Link>
          </p>
          <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
            Administrator?{' '}
            <Link to="/admin-login">Admin login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}