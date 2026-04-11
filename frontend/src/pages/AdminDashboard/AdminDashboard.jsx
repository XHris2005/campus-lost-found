import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMatches, updateMatchStatus, getStats, getUsers } from '../../api/adminApi';
import { getAllClaims, processClaim } from '../../api/claimApi';
import { getAllChats } from '../../api/chatApi';
import AdminMatchCard from '../../components/AdminMatchCard/AdminMatchCard';
import ClaimCard from '../../components/ClaimCard/ClaimCard';;
import { getBadge } from '../../utils/badges';
import {
  FiSearch, FiPackage, FiClock, FiCheckCircle,
  FiXCircle, FiUsers, FiMessageSquare, FiBarChart2,
} from 'react-icons/fi';
import './AdminDashboard.css';

const TABS = [
  { key: 'matches', label: 'Pending Matches', icon: <FiSearch size={16} /> },
  { key: 'reviewed', label: 'Reviewed', icon: <FiCheckCircle size={16} /> },
  { key: 'claims', label: 'Claims', icon: <FiPackage size={16} /> },
  { key: 'chats', label: 'Chats', icon: <FiMessageSquare size={16} /> },
  { key: 'users', label: 'Users', icon: <FiUsers size={16} /> },
];

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [claims, setClaims] = useState([]);
  const [adminChats, setAdminChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [matchesData, statsData, usersData, claimsData, chatsData] =
        await Promise.all([
          getMatches(),
          getStats(),
          getUsers(),
          getAllClaims(),
          getAllChats(),
        ]);
      setMatches(matchesData);
      setStats(statsData);
      setUsers(usersData);
      setClaims(claimsData);
      setAdminChats(chatsData);
    } catch (err) {
      setError('Could not load admin data. Please try again.');
    }
    setLoading(false);
  }

  async function handleApprove(matchId) {
    setActionLoading(true);
    try {
      await updateMatchStatus(matchId, 'approved');
      setSuccessMsg('Match approved and owner notified!');
      setMatches(prev =>
        prev.map(m => m.id === matchId ? { ...m, status: 'approved' } : m)
      );
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Could not approve match.');
    }
    setActionLoading(false);
  }

  async function handleReject(matchId) {
    setActionLoading(true);
    try {
      await updateMatchStatus(matchId, 'rejected');
      setSuccessMsg('Match rejected.');
      setMatches(prev =>
        prev.map(m => m.id === matchId ? { ...m, status: 'rejected' } : m)
      );
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Could not reject match.');
    }
    setActionLoading(false);
  }

  async function handleVerifyClaim(claimId) {
    setActionLoading(true);
    try {
      await processClaim(claimId, 'verified');
      setSuccessMsg('Claim verified — item marked as recovered!');
      setClaims(prev =>
        prev.map(c => c.id === claimId ? { ...c, status: 'verified' } : c)
      );
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Could not verify claim.');
    }
    setActionLoading(false);
  }

  async function handleRejectClaim(claimId) {
    setActionLoading(true);
    try {
      await processClaim(claimId, 'rejected');
      setSuccessMsg('Claim rejected.');
      setClaims(prev =>
        prev.map(c => c.id === claimId ? { ...c, status: 'rejected' } : c)
      );
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Could not reject claim.');
    }
    setActionLoading(false);
  }

  const pendingMatches = matches.filter(m => m.status === 'pending');
  const claimedLostItemIds = new Set(claims.map(c => c.lostItemId));
  const reviewedMatches = matches.filter(m =>
    m.status !== 'pending' && !claimedLostItemIds.has(m.lostItemId)
  );

  const statCards = stats ? [
    {
      icon: <FiSearch size={20} />,
      label: 'Lost Items',
      value: stats.totalLostItems,
      color: 'stat-blue',
    },
    {
      icon: <FiPackage size={20} />,
      label: 'Found Items',
      value: stats.totalFoundItems,
      color: 'stat-green',
    },
    {
      icon: <FiClock size={20} />,
      label: 'Pending Matches',
      value: stats.pendingMatches,
      color: 'stat-orange',
    },
    {
      icon: <FiCheckCircle size={20} />,
      label: 'Approved',
      value: stats.approvedMatches,
      color: 'stat-success',
    },
    {
      icon: <FiXCircle size={20} />,
      label: 'Rejected',
      value: stats.rejectedMatches,
      color: 'stat-error',
    },
    {
      icon: <FiUsers size={20} />,
      label: 'Total Users',
      value: stats.totalUsers,
      color: 'stat-purple',
    },
  ] : [];

  function getTabCount(key) {
    if (key === 'matches') return pendingMatches.length;
    if (key === 'reviewed') return reviewedMatches.length;
    if (key === 'claims') return claims.length;
    if (key === 'chats') return adminChats.length;
    if (key === 'users') return users.length;
    return 0;
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="admin-subtitle">
            Manage matches, claims, chats and users
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchData}>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="admin-stats-grid">
          {statCards.map((stat) => (
            <div key={stat.label} className={`admin-stat-card card ${stat.color}`}>
              <div className="admin-stat-icon">{stat.icon}</div>
              <div>
                <span className="admin-stat-value">{stat.value}</span>
                <span className="admin-stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {successMsg && (
        <div className="alert alert-success">{successMsg}</div>
      )}
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
            <span className="admin-tab-count">{getTabCount(tab.key)}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading admin data...</p>
        </div>
      ) : (
        <div className="admin-content">
          {/* Pending Matches */}
          {activeTab === 'matches' && (
            <>
              {pendingMatches.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🎯</div>
                  <h3>No pending matches</h3>
                  <p>All matches have been reviewed</p>
                </div>
              ) : (
                pendingMatches.map(match => (
                  <AdminMatchCard
                    key={match.id}
                    match={match}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    loading={actionLoading}
                  />
                ))
              )}
            </>
          )}

          {/* Reviewed Matches */}
          {activeTab === 'reviewed' && (
            <>
              {reviewedMatches.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No reviewed matches yet</h3>
                  <p>Reviewed matches will appear here</p>
                </div>
              ) : (
                reviewedMatches.map(match => (
                  <AdminMatchCard
                    key={match.id}
                    match={match}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    loading={actionLoading}
                  />
                ))
              )}
            </>
          )}

          {/* Claims */}
          {activeTab === 'claims' && (
            <>
              {claims.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🏷️</div>
                  <h3>No claims submitted yet</h3>
                  <p>Claims will appear here when users submit them</p>
                </div>
              ) : (
                claims.map(claim => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    onVerify={handleVerifyClaim}
                    onReject={handleRejectClaim}
                    loading={actionLoading}
                  />
                ))
              )}
            </>
          )}

          {/* Chats */}
          {activeTab === 'chats' && (
  <>
    {adminChats.length === 0 ? (
      <div className="empty-state">
        <div className="empty-state-icon">💬</div>
        <h3>No chats yet</h3>
        <p>Chats are created when matches are approved</p>
      </div>
    ) : (
      <div className="admin-chats-list">
        {adminChats.map(chat => (
          <div key={chat.id} className="admin-chat-card card">
            {/* Chat Header */}
            <div className="admin-chat-header">
              <div className="admin-chat-img">
                {chat.lastMessage ? (
                  <div className="chat-active-dot" />
                ) : null}
                <FiMessageSquare size={20} />
              </div>
              <div className="admin-chat-info">
                <div className="admin-chat-title-row">
                  <h3 className="admin-chat-title">
                    Chat — {chat.id.slice(0, 8)}...
                  </h3>
                  <span className={`badge ${
                    chat.status === 'completed'
                      ? 'badge-success'
                      : 'badge-warning'
                  }`}>
                    {chat.status}
                  </span>
                </div>
                <div className="admin-chat-meta">
                  <span>
                    Owner: {chat.ownerConfirmed ? '✅ Confirmed' : '⏳ Pending'}
                  </span>
                  <span>
                    Finder: {chat.finderConfirmed ? '✅ Confirmed' : '⏳ Pending'}
                  </span>
                  <span>
                    Created: {new Date(chat.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => window.open(`/chat/${chat.id}`, '_blank')}
              >
                Monitor Chat
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
)}

          {/* Users */}
          {activeTab === 'users' && (
            <>
              {users.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <h3>No users found</h3>
                </div>
              ) : (
                <div className="admin-chats-table card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        {['Name', 'Email', 'Badge', 'Role', 'Joined'].map(h => (
                          <th key={h} className="admin-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="admin-tr">
                          <td className="admin-td">
                            <div className="user-name-cell">
                              <div className="user-avatar">
                                {user.displayName?.charAt(0).toUpperCase()}
                              </div>
                              <span>{user.displayName}</span>
                            </div>
                          </td>
                          <td className="admin-td admin-td-muted">{user.email}</td>
                          <td className="admin-td">
                            <span className={`badge ${
                              user.role === 'admin' ? 'badge-admin' :
                              user.role === 'finder' ? 'badge-success' : 'badge-info'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="admin-td">
                            {(() => {
                              const badge = getBadge(user.recoveredCount || 0);
                              return (
                                <span style={{
                                  fontSize: '0.78rem',
                                  fontWeight: '700',
                                  color: badge.color,
                                  backgroundColor: badge.bg,
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '999px',
                                  }}>
                                    {badge.icon} {badge.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="admin-td admin-td-muted">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}