import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
  FiUser, FiMail, FiLock, FiArrowRight,
  FiSearch, FiSun, FiMoon,
} from 'react-icons/fi';
import Logo from '../../components/Logo/Logo';
import { signInWithGoogle } from '../../api/authApi';
import './Register.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth, formData.email, formData.password
      );
      await updateProfile(user, { displayName: formData.name });
      await setDoc(doc(db, 'users', user.uid), {
  uid: user.uid,
  displayName: formData.name,
  email: formData.email,
  role: 'user',
  recoveredCount: 0,
  createdAt: new Date().toISOString(),
});
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
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
            <h1>Join the Community</h1>
            <p>
              Help reunite lost items with their owners at the
              University of Calabar.
            </p>
          </div>
          <div className="auth-features">
            {[
              '🤖 AI matches items automatically',
              '📸 Photo-based visual matching',
              '🔔 Get notified of matches instantly',
              '✅ Secure claim verification',
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
            <h2>Create account</h2>
            <p>Get started with Recova today</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrap">
                <FiUser className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrap">
                <FiMail className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <FiArrowRight size={16} />}
            </button>
          </form>
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
            Already have an account?{' '}
            <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}