import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { registerBusiness } from '../../api/userApi';
import Logo from '../../components/Logo/Logo';
import {
  FiLock, FiMail, FiUser, FiArrowRight, FiBriefcase, FiMapPin, FiPhone,
  FiSun, FiMoon, FiClock, FiEye, FiEyeOff,
} from 'react-icons/fi';
import './RegisterBusiness.css';

export default function RegisterBusiness() {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bizId, setBizId] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      // Create account via backend (Admin SDK) — returns bizId
      // Account is created but status: 'pending' — no sign-in happens here,
      // since access is gated on admin approval, not email verification.
      const result = await registerBusiness({
        name, businessName, location, phone, email, password,
      });

      setBizId(result.bizId);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  // Show pending-approval screen with Business ID after successful submission
  if (bizId) {
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
              <p>Your business account request has been submitted.</p>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrap">
            <div className="business-pending-reveal">
              <FiClock size={48} color="var(--warning)" />
              <h2>Pending Admin Approval</h2>
              <p>Your Business ID is:</p>
              <div className="business-id-box">
                {bizId}
              </div>
              <p className="business-id-hint">
                An admin will review your registration shortly. You'll receive an email
                once your account is approved and ready to use — save this ID for your records.
              </p>
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate('/')}
              >
                Back to Home <FiArrowRight size={16} />
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
            <h1>Business Owner Registration</h1>
            <p>Register your shop or business to report and recover items on campus.</p>
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
            <h2>Create Business Account</h2>
            <p>Your account will be reviewed by an admin before activation</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Your Full Name</label>
              <div className="input-icon-wrap">
                <FiUser className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="text"
                  placeholder="e.g. Mrs. Grace Effiong"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Business Name</label>
              <div className="input-icon-wrap">
                <FiBriefcase className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="text"
                  placeholder="e.g. Grace Provisions Store"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Shop / Stall Location</label>
              <div className="input-icon-wrap">
                <FiMapPin className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="text"
                  placeholder="e.g. Along Faculty of Science Road, Stall 12"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-icon-wrap">
                <FiPhone className="input-icon" size={16} />
                <input
                  className="form-input input-with-icon"
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
              {loading ? 'Submitting...' : 'Submit Registration'}
              {!loading && <FiArrowRight size={16} />}
            </button>
          </form>

          <p className="auth-switch">
            Already approved?{' '}
            <Link to="/business-login">Sign in here</Link>
          </p>
          <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
            Student?{' '}
            <Link to="/register">Student registration</Link>{' '}
            &middot; Lecturer?{' '}
            <Link to="/register-lecturer">Lecturer registration</Link>
          </p>
        </div>
      </div>
    </div>
  );
}