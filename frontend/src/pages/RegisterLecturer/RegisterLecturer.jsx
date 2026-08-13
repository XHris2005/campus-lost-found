import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { registerLecturer } from '../../api/userApi';
import Logo from '../../components/Logo/Logo';
import {
  FiLock, FiMail, FiUser, FiArrowRight,
  FiSun, FiMoon, FiCheckCircle, FiEye, FiEyeOff,
} from 'react-icons/fi';
import './RegisterLecturer.css';

export default function RegisterLecturer() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!email.toLowerCase().endsWith('@unical.edu.ng')) {
      return setError('Only UNICAL institutional emails (@unical.edu.ng) are allowed.');
    }
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      // Create account via backend (Admin SDK) — returns lecturerId
      // Create account via backend (Admin SDK) — returns lecturerId.
      // The backend also generates and emails the verification link itself,
      // via our own email service rather than Firebase's built-in delivery.
      const result = await registerLecturer({ name, email, password });

      // Still sign in client-side so VerifyEmail.jsx has a currentUser to work with
      await signInWithEmailAndPassword(auth, email, password);

      setLecturerId(result.lecturerId);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  // Show success screen with Lecturer ID before redirecting
  if (lecturerId) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-brand" onClick={() => navigate('/')}>
              <Logo size={30} />
              <span>Recova</span>
            </div>
            <div className="auth-left-text">
              <h1>Welcome to Recova</h1>
              <p>Your lecturer account has been created successfully.</p>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrap">
            <div className="lecturer-id-reveal">
              <FiCheckCircle size={48} color="var(--success)" />
              <h2>Account Created!</h2>
              <p>Please verify your email before logging in. Your Lecturer ID is:</p>
              <div className="lecturer-id-box">
                {lecturerId}
              </div>
              <p className="lecturer-id-hint">
                Save this ID — you can use it to log in instead of your email.
              </p>
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate('/verify-email')}
              >
                Continue to Email Verification <FiArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
            <h1>Lecturer Registration</h1>
            <p>Create your Recova account using your UNICAL institutional email.</p>
          </div>
          <div className="auth-features">
            {[
              '🎓 UNICAL staff verified',
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
            <h2>Create Lecturer Account</h2>
            <p>Use your official UNICAL email address</p>
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
                  placeholder="e.g. Dr. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">UNICAL Email</label>
              <p className="form-hint">Must end with @unical.edu.ng</p>
              <div className="input-icon-wrap">
                <FiMail className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="email"
                  placeholder="you@unical.edu.ng"
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
                  placeholder="Min. 6 characters"
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

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              {!loading && <FiArrowRight size={16} />}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/lecturer-login">Sign in here</Link>
          </p>
          <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
            Student?{' '}
            <Link to="/register">Student registration</Link>
          </p>
          <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
            Own a business?{' '}
            <Link to="/register-business">Business registration</Link>
          </p>
        </div>
      </div>
    </div>
  );
}