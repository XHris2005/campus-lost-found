import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatches, updateMatchStatus, getStats, getUsers } from '../../api/adminApi';
import AdminMatchCard from '../../components/AdminMatchCard/AdminMatchCard';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { getAllClaims, processClaim } from '../../api/claimApi';
import { getAllChats } from '../../api/chatApi';
import ClaimCard from '../../components/ClaimCard/ClaimCard';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [adminChats, setAdminChats] = useState([]);

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
    setAdminChats(chatsData);
    setMatches(matchesData);
    setStats(statsData);
    setUsers(usersData);
    setClaims(claimsData);
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
      setMatches((prev) =>
        prev.map((m) => m.id === matchId ? { ...m, status: 'approved' } : m)
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
      setMatches((prev) =>
        prev.map((m) => m.id === matchId ? { ...m, status: 'rejected' } : m)
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
    setClaims((prev) =>
      prev.map((c) => c.id === claimId ? { ...c, status: 'verified' } : c)
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
    setClaims((prev) =>
      prev.map((c) => c.id === claimId ? { ...c, status: 'rejected' } : c)
    );
    setTimeout(() => setSuccessMsg(''), 3000);
  } catch (err) {
    setError('Could not reject claim.');
  }
  setActionLoading(false);
}

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  const pendingMatches = matches.filter((m) => m.status === 'pending');
  const reviewedMatches = matches.filter((m) => m.status !== 'pending');

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <span style={styles.navTitle}>🎓 Campus Lost & Found — Admin</span>
        <div style={styles.navRight}>
          <span style={styles.adminEmail}>{currentUser?.email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Stats Cards */}
        {stats && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{stats.totalLostItems}</span>
              <span style={styles.statLabel}>Lost Items</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{stats.totalFoundItems}</span>
              <span style={styles.statLabel}>Found Items</span>
            </div>
            <div style={{ ...styles.statCard, borderTop: '4px solid #d97706' }}>
              <span style={styles.statNumber}>{stats.pendingMatches}</span>
              <span style={styles.statLabel}>Pending Matches</span>
            </div>
            <div style={{ ...styles.statCard, borderTop: '4px solid #16a34a' }}>
              <span style={styles.statNumber}>{stats.approvedMatches}</span>
              <span style={styles.statLabel}>Approved Matches</span>
            </div>
            <div style={{ ...styles.statCard, borderTop: '4px solid #dc2626' }}>
              <span style={styles.statNumber}>{stats.rejectedMatches}</span>
              <span style={styles.statLabel}>Rejected Matches</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{stats.totalUsers}</span>
              <span style={styles.statLabel}>Total Users</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          {['matches', 'reviewed', 'users', 'claims', 'chats'].map((tab) => (
            <button
              key={tab}
              style={{
                ...styles.tab,
                backgroundColor: activeTab === tab ? '#1a1a2e' : '#fff',
                color: activeTab === tab ? '#fff' : '#1a1a2e',
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'matches' && `🔎 Pending Matches (${pendingMatches.length})`}
              {tab === 'reviewed' && `📋 Reviewed (${reviewedMatches.length})`}
              {tab === 'users' && `👥 Users (${users.length})`}
              {tab === 'claims' && `🏷️ Claims (${claims.length})`}
              {tab === 'chats' && `💬 Chats (${adminChats.length})`}
            </button>
          ))}
        </div>

        {/* Messages */}
        {successMsg && <div style={styles.success}>{successMsg}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {/* Content */}
        {loading ? (
          <p style={styles.loadingText}>Loading...</p>
        ) : (
          <>
            {/* Pending Matches Tab */}
            {activeTab === 'matches' && (
              <>
                {pendingMatches.length === 0 ? (
                  <p style={styles.emptyText}>No pending matches to review.</p>
                ) : (
                  pendingMatches.map((match) => (
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

            {/* Reviewed Matches Tab */}
            {activeTab === 'reviewed' && (
              <>
                {reviewedMatches.length === 0 ? (
                  <p style={styles.emptyText}>No reviewed matches yet.</p>
                ) : (
                  reviewedMatches.map((match) => (
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

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div style={styles.usersTable}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Name', 'Email', 'Role', 'Joined'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={styles.tr}>
                        <td style={styles.td}>{user.displayName}</td>
                        <td style={styles.td}>{user.email}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.roleBadge,
                            backgroundColor:
                              user.role === 'admin' ? '#ede9fe' :
                              user.role === 'finder' ? '#dcfce7' : '#dbeafe',
                            color:
                              user.role === 'admin' ? '#7c3aed' :
                              user.role === 'finder' ? '#16a34a' : '#1d4ed8',
                          }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'claims' && (
                <>
                {claims.length === 0 ? (
                    <p style={styles.emptyText}>No claims submitted yet.</p>
                ) : (
                claims.map((claim) => (
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
            {activeTab === 'chats' && (
              <>
              {adminChats.length === 0 ? (
                <p style={styles.emptyText}>No chats yet.</p>
              ) : (
                <div style={styles.usersTable}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {['Chat ID', 'Owner Confirmed', 'Finder Confirmed', 'Status', 'Created', 'Action'].map((h) => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adminChats.map((chat) => (
                        <tr key={chat.id} style={styles.tr}>
                          <td style={styles.td}>{chat.id.slice(0, 8)}...</td>
                          <td style={styles.td}>{chat.ownerConfirmed ? '✅' : '⏳'}</td>
                          <td style={styles.td}>{chat.finderConfirmed ? '✅' : '⏳'}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.roleBadge,
                              backgroundColor: chat.status === 'completed' ? '#dcfce7' : '#fef9c3',
                              color: chat.status === 'completed' ? '#16a34a' : '#b45309',
                              }}>
                                {chat.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {new Date(chat.createdAt).toLocaleDateString()}
                          </td>
                          <td style={styles.td}>
                            <button
                              style={styles.viewChatBtn}
                              onClick={() => window.open(`/chat/${chat.id}`, '_blank')}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f4f8' },
  navbar: {
    backgroundColor: '#1a1a2e',
    padding: '0 1.5rem',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navTitle: { color: '#fff', fontWeight: '700', fontSize: '1rem' },
  navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  adminEmail: { color: '#aaa', fontSize: '0.85rem' },
  logoutBtn: {
    padding: '0.4rem 1rem',
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  content: { padding: '2rem', maxWidth: '1000px', margin: '0 auto' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderTop: '4px solid #1a1a2e',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  statNumber: { fontSize: '2rem', fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: '0.75rem', color: '#666', fontWeight: '500' },
  tabs: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: {
    padding: '0.6rem 1.25rem',
    border: '2px solid #1a1a2e',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  success: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  viewChatBtn: {
    padding: '0.3rem 0.75rem',
    backgroundColor: '#0891b2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  loadingText: { color: '#666', textAlign: 'center', padding: '2rem' },
  emptyText: { color: '#888', textAlign: 'center', padding: '2rem' },
  usersTable: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.75rem 1rem', backgroundColor: '#f8fafc', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#666', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#333' },
  roleBadge: { padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
};