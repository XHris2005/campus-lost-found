import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight, FiShield, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo/Logo';
import RoleTabs from '../../components/RoleTabs/RoleTabs';
import './AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // Verify admin role in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        await auth.signOut();
        setError('Access denied. This login is for administrators only.');
        setLoading(false);
        return;
      }

      navigate('/admin', { replace: true });
    } catch (err) {
      setError('Invalid email or password.');
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <button className="auth-theme-btn admin-login-theme" onClick={toggleTheme}>
        {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
      </button>

      <div className="admin-login-card">
        <div className="admin-login-brand" onClick={() => navigate('/')}>
          <Logo size={28} />
          <span>Recova</span>
        </div>

        <div className="admin-login-icon">
          <FiShield size={28} />
        </div>

        <h2>Admin Login</h2>
        <p>Restricted access — administrators only</p>

        <RoleTabs active="admin" mode="login" />

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
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
                placeholder="admin@recova.unical.edu.ng"
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
            {loading ? 'Signing in...' : 'Sign In as Admin'}
            {!loading && <FiArrowRight size={16} />}
          </button>
        </form>

        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Not an admin? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/login')}>Student login</span>
        </p>
      </div>
    </div>
  );
}