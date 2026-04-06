import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { getBadge } from '../../utils/badges';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useState, useEffect } from 'react';
import {
  FiSearch, FiHome, FiPlusCircle, FiList,
  FiMessageSquare, FiShield, FiLogOut,
  FiPackage,
} from 'react-icons/fi';
import './SideBar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [recoveredCount, setRecoveredCount] = useState(0);

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

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  function isActive(path) {
    return location.pathname === path;
  }

  const navLinks = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <FiHome size={20} />,
    },
    {
      path: '/report-lost',
      label: 'Report Lost',
      icon: <FiSearch size={20} />,
    },
    {
      path: '/report-found',
      label: 'Report Found',
      icon: <FiPackage size={20} />,
    },
    {
      path: '/listings',
      label: 'Browse Listings',
      icon: <FiList size={20} />,
    },
    {
      path: '/my-chats',
      label: 'My Chats',
      icon: <FiMessageSquare size={20} />,
    },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand" onClick={() => navigate('/')}>
        <div className="sidebar-brand-icon">
          <FiSearch size={20} />
        </div>
        <span className="sidebar-brand-name">CampusFind</span>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {currentUser?.displayName?.charAt(0).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">
            {currentUser?.displayName}
          </p>
          <span className={`sidebar-role-badge ${
            userRole === 'admin' ? 'sidebar-role-admin' : 'sidebar-role-user'
          }`}>
              {userRole === 'admin' ? 'Admin' : 'User'}
          </span>
          <span
            className="sidebar-badge"
            style={{
              color: badge.color,
              backgroundColor: badge.bg,
            }}
          >
            {badge.icon} {badge.label}
          </span>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Nav Links */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Navigation</p>
        {navLinks.map((link) => (
          <button
            key={link.path}
            className={`sidebar-link ${isActive(link.path) ? 'sidebar-link-active' : ''}`}
            onClick={() => { navigate(link.path); onClose(); }}
            >
            <span className="sidebar-link-icon">{link.icon}</span>
            <span className="sidebar-link-label">{link.label}</span>
            {isActive(link.path) && (
              <span className="sidebar-link-indicator" />
            )}
          </button>
        ))}

        {/* Admin Link */}
        {userRole === 'admin' && (
          <>
            <p className="sidebar-section-label" style={{ marginTop: '1rem' }}>
              Administration
            </p>
            <button
              className={`sidebar-link sidebar-link-admin ${isActive('/admin') ? 'sidebar-link-active' : ''}`}
              onClick={() =>{navigate('/admin'); onClose(); } }
            >
              <span className="sidebar-link-icon">
                <FiShield size={20} />
              </span>
              <span className="sidebar-link-label">Admin Dashboard</span>
              {isActive('/admin') && (
                <span className="sidebar-link-indicator" />
              )}
            </button>
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <button className="sidebar-logout" onClick={()=>{ handleLogout(); onClose()}}>
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}