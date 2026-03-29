import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getLostItems, getFoundItems } from '../../api/itemApi';
import usePushNotifications from '../../hooks/usePushNotifications';
import {
  FiSearch, FiPackage, FiAlertCircle,
  FiBell, FiPlus, FiCheckCircle,
  FiMapPin, FiClock, FiMail, FiUser,
} from 'react-icons/fi';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [myLostItems, setMyLostItems] = useState([]);
  const [myFoundItems, setMyFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  usePushNotifications();

  useEffect(() => {
    async function fetchMyItems() {
      try {
        const [lost, found] = await Promise.all([
          getLostItems(),
          getFoundItems(),
        ]);
        setMyLostItems(lost.filter(i => i.userId === currentUser?.uid));
        setMyFoundItems(found.filter(i => i.userId === currentUser?.uid));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchMyItems();
  }, [currentUser]);

  const recentActivity = [
    ...myLostItems.map(item => ({ ...item, type: 'lost' })),
    ...myFoundItems.map(item => ({ ...item, type: 'found' })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  const stats = [
    {
      icon: <FiAlertCircle size={22} />,
      label: 'Active Lost Reports',
      value: myLostItems.filter(i => i.status === 'active').length,
      color: 'stat-blue',
    },
    {
      icon: <FiPackage size={22} />,
      label: 'Found Items Reported',
      value: myFoundItems.length,
      color: 'stat-green',
    },
    {
      icon: <FiCheckCircle size={22} />,
      label: 'Potential Matches',
      value: myLostItems.filter(i => i.status === 'matched').length,
      color: 'stat-orange',
      highlight: myLostItems.filter(i => i.status === 'matched').length > 0,
    },
    {
      icon: <FiBell size={22} />,
      label: 'Total Reports',
      value: myLostItems.length + myFoundItems.length,
      color: 'stat-purple',
    },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {currentUser?.displayName}. Here is what is happening with your items.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/report-lost')}
          >
            <FiPlus size={16} />
            Report Lost Item
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/report-found')}
          >
            <FiCheckCircle size={16} />
            Report Found Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`stat-card card ${stat.color} ${stat.highlight ? 'stat-highlight' : ''}`}
          >
            <div className="stat-icon-wrap">{stat.icon}</div>
            <div className="stat-info">
              <span className="stat-value">{loading ? '—' : stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
            {stat.highlight && (
              <span className="stat-badge">HIGH PRIORITY</span>
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Recent Activity */}
        <div className="activity-section card">
          <div className="activity-header">
            <h2 className="activity-title">Recent Activity</h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/listings')}
            >
              View All
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No activity yet</h3>
              <p>Start by reporting a lost or found item</p>
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-img">
                    {item.imageURL
                      ? <img src={item.imageURL} alt={item.name} />
                      : <FiPackage size={20} />
                    }
                  </div>
                  <div className="activity-info">
                    <div className="activity-name-row">
                      <span className="activity-name">{item.name}</span>
                      <span className={`badge ${item.type === 'lost' ? 'badge-error' : 'badge-success'}`}>
                        {item.type.toUpperCase()}
                      </span>
                      {item.status === 'matched' && (
                        <span className="badge badge-warning">MATCH FOUND?</span>
                      )}
                    </div>
                    <div className="activity-meta">
                      <span><FiMapPin size={12} /> {item.location}</span>
                      <span><FiClock size={12} /> {timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Overview */}
        <div className="profile-section card">
          <h2 className="activity-title">Profile Overview</h2>

          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {currentUser?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-online-dot" />
          </div>

          <h3 className="profile-name">{currentUser?.displayName}</h3>
          <span className={`badge badge-info profile-role`}>
            {userRole}
          </span>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">{myLostItems.length}</span>
              <span className="profile-stat-label">Reports</span>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <span className="profile-stat-value">
                {myLostItems.filter(i => i.status === 'recovered').length}
              </span>
              <span className="profile-stat-label">Returned</span>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail-item">
              <div className="profile-detail-icon">
                <FiMail size={16} />
              </div>
              <div>
                <p className="profile-detail-label">Email</p>
                <p className="profile-detail-value">{currentUser?.email}</p>
              </div>
            </div>
            <div className="profile-detail-item">
              <div className="profile-detail-icon">
                <FiUser size={16} />
              </div>
              <div>
                <p className="profile-detail-label">Role</p>
                <p className="profile-detail-value" style={{ textTransform: 'capitalize' }}>
                  {userRole}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}