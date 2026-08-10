import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { verifyMatricNo, claimMatricNo } from '../../api/userApi';
import Logo from '../../components/Logo/Logo';
import {
  FiLock, FiArrowRight, FiMail,
  FiSun, FiMoon, FiCheckCircle, FiEye, FiEyeOff,
} from 'react-icons/fi';
import './Register.css';

export default function Register() {
  const [step, setStep] = useState(1); // 1=matric (shows preset email), 2=password
  const [matricNo, setMatricNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState('');
  const [matricLoading, setMatricLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  async function handleVerifyMatric() {
    if (!matricNo.trim()) return;
    setMatricLoading(true);
    setError('');
    try {
      const { student } = await verifyMatricNo(matricNo);
      setStudentData(student);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Matric number not found. Please check and try again.');
    }
    setMatricLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, studentData.email, password);
      await updateProfile(user, { displayName: studentData.name });
      await sendEmailVerification(user);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: studentData.name,
        email: studentData.email,
        matricNo: studentData.matricNo,
        department: studentData.department,
        role: 'user',
        recoveredCount: 0,
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });

      // Lock this matric number so it can't be claimed again.
      // If this fails, don't block the user — their account is already
      // created and valid. Log it so it can be fixed manually in Firestore.
      try {
        await claimMatricNo(studentData.matricNo, user.uid);
      } catch (claimErr) {
        console.error('Failed to lock matric number after registration:', claimErr);
      }

      navigate('/verify-email', { replace: true });
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
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
            <h1>Join the Community</h1>
            <p>Help reunite lost items with their owners at the University of Calabar.</p>
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

          {/* Step indicators */}
          <div className="register-steps">
            {['Matric No', 'Password'].map((label, i) => (
              <div key={label} className={`register-step ${step > i + 1 ? 'step-done' : ''} ${step === i + 1 ? 'step-active' : ''}`}>
                <div className="step-dot">
                  {step > i + 1 ? <FiCheckCircle size={14} /> : i + 1}
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* Step 1 — Matric Number */}
          {step === 1 && (
            <div className="auth-form">
              <div className="form-group">
                <label className="form-label">Matric Number</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. 20/097344060"
                    value={matricNo}
                    onChange={(e) => setMatricNo(e.target.value)}
                    disabled={matricLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyMatric()}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleVerifyMatric}
                    disabled={matricLoading || !matricNo.trim()}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {matricLoading ? 'Checking...' : 'Verify'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Password (email is preset, shown read-only) */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="matric-verified-box">
                <FiCheckCircle size={16} color="var(--success)" />
                <div>
                  <p className="matric-verified-name">{studentData?.name}</p>
                  <p className="matric-verified-dept">{studentData?.department}</p>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Email Address</label>
                <p className="form-hint">Is this you? A verification link will be sent here.</p>
                <div className="input-icon-wrap">
                  <FiMail className="input-icon" size={16} />
                  <input
                    className="form-input input-with-icon"
                    type="email"
                    value={studentData?.maskedEmail || studentData?.email || ''}
                    disabled
                    readOnly
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
                    onClick={() => setShowPassword((prev) => !prev)}
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
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
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
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <FiArrowRight size={16} />}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-full"
                onClick={() => setStep(1)}
                style={{ marginTop: '0.5rem' }}
                disabled={loading}
              >
                Back
              </button>
            </form>
          )}
          <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
  Are you a lecturer?{' '}
  <Link to="/register-lecturer">Lecturer registration</Link>
</p>

          <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
  Own a business?{' '}
  <Link to="/register-business">Business registration</Link>
</p>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login">Sign in here</Link>
          </p>

        </div>
      </div>
    </div>
  );
}