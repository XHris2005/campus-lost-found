import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { getBadge } from '../../utils/badges';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useState, useEffect } from 'react';
import {
  FiSearch, FiHome, FiList,
  FiMessageSquare, FiShield, FiLogOut,
  FiPackage, FiCheckCircle, FiUsers, FiBriefcase, FiAlertTriangle,
} from 'react-icons/fi';
import Logo from '../Logo/Logo';
import './SideBar.css';

const ADMIN_TABS = [
  { key: 'matches', label: 'Pending Matches', icon: <FiSearch size={20} /> },
  { key: 'reviewed', label: 'Reviewed', icon: <FiCheckCircle size={20} /> },
  { key: 'claims', label: 'Claims', icon: <FiPackage size={20} /> },
  { key: 'chats', label: 'Chats', icon: <FiMessageSquare size={20} /> },
  { key: 'business', label: 'Business Owners', icon: <FiBriefcase size={20} /> },
  { key: 'users', label: 'Users', icon: <FiUsers size={20} /> },
];

export default function Sidebar({ isOpen, onClose, tabCounts = {} }) {
  const { currentUser, userRole, emailVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [recoveredCount, setRecoveredCount] = useState(0);

  const isAdminPage = location.pathname === '/admin';
  const activeTab = searchParams.get('tab') || 'matches';

  useEffect(() => {
    async function fetchCount() {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        setRecoveredCount(userDoc.data()?.recoveredCount || 0);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCount();
  }, [currentUser]);

  const badge = getBadge(recoveredCount);
  const showUnverifiedBadge = userRole === 'lecturer' && currentUser && !emailVerified;

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  function isActive(path) {
    return location.pathname === path;
  }

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome size={20} /> },
    { path: '/report-lost', label: 'Report Lost', icon: <FiSearch size={20} /> },
    { path: '/report-found', label: 'Report Found', icon: <FiPackage size={20} /> },
    { path: '/listings', label: 'Browse Listings', icon: <FiList size={20} /> },
    { path: '/my-chats', label: 'My Chats', icon: <FiMessageSquare size={20} /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand" onClick={() => navigate('/')}>
        <Logo size={28} />
        <span className="sidebar-brand-name">Recova</span>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {currentUser?.displayName?.charAt(0).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{currentUser?.displayName}</p>
          <span className={`sidebar-role-badge ${userRole === 'admin' ? 'sidebar-role-admin' : 'sidebar-role-user'}`}>
            {userRole === 'admin' ? 'Admin' : 'User'}
          </span>
          <span className="sidebar-badge" style={{ color: badge.color, backgroundColor: badge.bg }}>
            {badge.icon} {badge.label}
          </span>
          {showUnverifiedBadge && (
            <button
              type="button"
              className="sidebar-verify-badge"
              onClick={() => { navigate('/verify-email'); onClose(); }}
            >
              <FiAlertTriangle size={12} /> Email not verified
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
        {/* Admin on /admin page — show admin tabs */}
        {userRole === 'admin' && isAdminPage ? (
          <>
            <p className="sidebar-section-label">Administration</p>
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`sidebar-link ${activeTab === tab.key ? 'sidebar-link-active' : ''}`}
                onClick={() => { setSearchParams({ tab: tab.key }); onClose(); }}
              >
                <span className="sidebar-link-icon">{tab.icon}</span>
                <span className="sidebar-link-label">{tab.label}</span>
                {tabCounts[tab.key] > 0 && (
                  <span className="sidebar-tab-count">{tabCounts[tab.key]}</span>
                )}
                {activeTab === tab.key && <span className="sidebar-link-indicator" />}
              </button>
            ))}
            <div className="sidebar-divider" style={{ margin: '1rem 0' }} />
            <button
              className="sidebar-link"
              onClick={() => { navigate('/dashboard'); onClose(); }}
            >
              <span className="sidebar-link-icon"><FiHome size={20} /></span>
              <span className="sidebar-link-label">User Dashboard</span>
            </button>
          </>
        ) : (
          <>
            {/* Regular user nav */}
            <p className="sidebar-section-label">Navigation</p>
            {navLinks.map((link) => (
              <button
                key={link.path}
                className={`sidebar-link ${isActive(link.path) ? 'sidebar-link-active' : ''}`}
                onClick={() => { navigate(link.path); onClose(); }}
              >
                <span className="sidebar-link-icon">{link.icon}</span>
                <span className="sidebar-link-label">{link.label}</span>
                {isActive(link.path) && <span className="sidebar-link-indicator" />}
              </button>
            ))}

            {/* Admin link for non-admin page */}
            {userRole === 'admin' && (
              <>
                <p className="sidebar-section-label" style={{ marginTop: '1rem' }}>Administration</p>
                <button
                  className={`sidebar-link sidebar-link-admin ${isActive('/admin') ? 'sidebar-link-active' : ''}`}
                  onClick={() => { navigate('/admin'); onClose(); }}
                >
                  <span className="sidebar-link-icon"><FiShield size={20} /></span>
                  <span className="sidebar-link-label">Admin Dashboard</span>
                  {isActive('/admin') && <span className="sidebar-link-indicator" />}
                </button>
              </>
            )}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <button className="sidebar-logout" onClick={() => { handleLogout(); onClose(); }}>
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}