import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { FiLock, FiArrowRight, FiMail, FiSun, FiMoon, FiEye, FiEyeOff, FiBriefcase } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo/Logo';
import './BusinessLogin.css';

export default function BusinessLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
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
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // Verify business_owner role + approval status in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'business_owner') {
        await auth.signOut();
        setError('Access denied. This login is for business owners only.');
        setLoading(false);
        return;
      }

      const status = userDoc.data().status;
      if (status === 'pending') {
        await auth.signOut();
        setError('Your account is still pending admin approval. You\'ll receive an email once it\'s reviewed.');
        setLoading(false);
        return;
      }
      if (status === 'rejected') {
        await auth.signOut();
        setError('Your business registration was not approved. Contact campus administration for details.');
        setLoading(false);
        return;
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  }

  function handleShowReset() {
    if (!email.trim()) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setShowReset(true);
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError('Could not send reset email. Please try again.');
    }
    setResetLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand" onClick={() => navigate('/')}>
            <Logo size={30} />
            <span>Recova</span>
          </div>
          <div className="auth-left-text">
            <h1>Business Portal</h1>
            <p>Sign in with your registered business email address.</p>
          </div>
          <div className="auth-features">
            {[
              '🏪 List your business on campus',
              '🤖 AI-powered item matching',
              '🔔 Real-time notifications',
              '💬 Built-in recovery chat',
            ].map((f) => (
              <div key={f} className="auth-feature-item">{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-top">
          <button className="auth-theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>Business Sign In</h2>
            <p>Use your registered email address</p>
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
                  onClick={() => setShowPassword((p) => !p)}
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
                    <label className="form-label">Reset link will be sent to</label>
                    <div className="input-icon-wrap">
                      <FiMail className="input-icon" size={16} />
                      <input
                        className="form-input input-with-icon"
                        type="email"
                        value={email}
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
            <Link to="/register-business">Register here</Link>
          </p>
          <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
            Student?{' '}
            <Link to="/login">Student login</Link>
          </p>
          <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
            Lecturer?{' '}
            <Link to="/lecturer-login">Lecturer login</Link>
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