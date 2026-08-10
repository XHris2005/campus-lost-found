import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import { getVisitorReport, getVisitorListings, getVisitorChatToken } from '../../api/visitorApi';
import ItemCard from '../../components/ItemCard/ItemCard';
import VisitorClaimModal from '../../components/VisitorClaimModal/VisitorClaimModal';
import Logo from '../../components/Logo/Logo';
import { FiCheckCircle, FiClock, FiSun, FiMoon } from 'react-icons/fi';
import '../Listings/Listings.css';
import './VisitorTrack.css';

export default function VisitorTrack() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [report, setReport] = useState(null);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingItem, setClaimingItem] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [token]);

  useEffect(() => {
    if (report?.itemType === 'lost') {
      fetchFoundItems();
    }
  }, [report]);

  async function fetchReport() {
    setLoading(true);
    setError('');
    try {
      const data = await getVisitorReport(token);
      setReport(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function fetchFoundItems() {
    setListingsLoading(true);
    try {
      const data = await getVisitorListings('found');
      setFoundItems(data);
    } catch (err) {
      console.error('Could not load found items:', err);
    }
    setListingsLoading(false);
  }

  async function handleOpenChat(chatId) {
    try {
      const { customToken } = await getVisitorChatToken(token);
      await signInWithCustomToken(auth, customToken);
      navigate(`/chat/${chatId}`);
    } catch (err) {
      setError('Could not open chat. Please try again.');
    }
  }

  const matchStatus = report?.matches?.[0]?.status || null;

  function statusBadge() {
    const chatId = report?.matches?.[0]?.chatId;

    if (matchStatus === 'auto_approved' || matchStatus === 'approved') {
      const score = report.matches[0].combinedScore;
      return (
        <div>
          <div className="visitor-status-badge visitor-status-matched">
            <FiCheckCircle size={16} />
            Match found!{score ? ` (${Math.round(score * 100)}% confidence)` : ''}
          </div>
          {chatId && (
            <button
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => handleOpenChat(chatId)}
            >
              Open Chat
            </button>
          )}
        </div>
      );
    }
    if (matchStatus === 'pending') {
      return (
        <div className="visitor-status-badge visitor-status-pending">
          <FiClock size={16} /> Possible match under admin review
        </div>
      );
    }
    return (
      <div className="visitor-status-badge visitor-status-pending">
        <FiClock size={16} /> Still searching for matches
      </div>
    );
  }

  return (
    <div className="visitor-page-wrap">
      <div className="visitor-public-header">
        <div className="visitor-brand" onClick={() => navigate('/')}>
          <Logo size={28} />
          <span>Recova</span>
        </div>
        <div className="visitor-header-right">
          <button className="visitor-theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
          <p className="visitor-header-note">
            <Link to="/visitor/report">Report another item</Link>
          </p>
        </div>
      </div>

      <div className="listings-page">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading your report...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h3>Could not load report</h3>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="listings-header">
              <div>
                <h1 className="page-title">
                  Your {report.itemType === 'lost' ? 'Lost' : 'Found'} Item Report
                </h1>
                <p className="listings-subtitle">
                  Hi {report.visitorName}, here's the status of your report
                </p>
              </div>
            </div>

            {statusBadge()}

            <div className="grid-auto" style={{ marginTop: '1.5rem', marginBottom: '2.5rem' }}>
              <ItemCard item={report.item} type={report.itemType} />
            </div>

            {report.itemType === 'lost' && (
              <>
                <div className="listings-header" style={{ marginTop: '2rem' }}>
                  <div>
                    <h2 className="page-title" style={{ fontSize: '1.3rem' }}>
                      Browse Found Items
                    </h2>
                    <p className="listings-subtitle">
                      See something that might be yours? Submit a claim below.
                    </p>
                  </div>
                </div>

                {listingsLoading ? (
                  <div className="loading-container">
                    <div className="spinner" />
                    <p>Loading found items...</p>
                  </div>
                ) : foundItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h3>No found items yet</h3>
                    <p>Check back later — items are reported regularly.</p>
                  </div>
                ) : (
                  <div className="grid-auto">
                    {foundItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        type="found"
                        onClaim={() => setClaimingItem(item)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {claimingItem && (
        <VisitorClaimModal
          foundItem={claimingItem}
          token={token}
          onClose={() => {
            setClaimingItem(null);
            fetchFoundItems();
          }}
        />
      )}
    </div>
  );
}