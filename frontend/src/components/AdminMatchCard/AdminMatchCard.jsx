import { FiPackage } from 'react-icons/fi';
import './AdminMatchCard.css';

export default function AdminMatchCard({ match, onApprove, onReject, loading }) {
  const { lostItem, foundItem, combinedScore, status } = match;
  const scorePercent = Math.round((combinedScore || 0) * 100);

  const scoreColor =
    scorePercent >= 85 ? 'score-high' :
    scorePercent >= 70 ? 'score-medium' : 'score-low';

  return (
    <div className="match-card card">
      {/* Score Row */}
      <div className="match-score-row">
        <span className="match-score-label">AI Match Score</span>
        <span className={`match-score-badge ${scoreColor}`}>
          {scorePercent}% match
        </span>
        <span className={`badge ${
          status === 'approved' ? 'badge-success' :
          status === 'rejected' ? 'badge-error' : 'badge-warning'
        }`}>
          {status}
        </span>
      </div>

      {/* Comparison */}
      <div className="match-comparison">
        {/* Lost Item */}
        <div className="match-item-box">
          <span className="match-item-label lost-label">🔍 Lost Item</span>
          {lostItem?.imageURL ? (
            <img src={lostItem.imageURL} alt={lostItem.name} className="match-item-img" />
          ) : (
            <div className="match-item-no-img">
              <FiPackage size={24} />
            </div>
          )}
          <p className="match-item-name">{lostItem?.name || 'Unknown'}</p>
          <p className="match-item-desc">{lostItem?.description}</p>
          <p className="match-item-meta">📍 {lostItem?.location}</p>
          <p className="match-item-meta">🏷️ {lostItem?.category}</p>
          <p className="match-item-meta">👤 {lostItem?.userEmail}</p>
        </div>

        {/* VS */}
        <div className="match-vs">
          <span>VS</span>
        </div>

        {/* Found Item */}
        <div className="match-item-box">
          <span className="match-item-label found-label">📦 Found Item</span>
          {foundItem?.imageURL ? (
            <img src={foundItem.imageURL} alt={foundItem.name} className="match-item-img" />
          ) : (
            <div className="match-item-no-img">
              <FiPackage size={24} />
            </div>
          )}
          <p className="match-item-name">{foundItem?.name || 'Unknown'}</p>
          <p className="match-item-desc">{foundItem?.description}</p>
          <p className="match-item-meta">📍 {foundItem?.location}</p>
          <p className="match-item-meta">🏷️ {foundItem?.category}</p>
          <p className="match-item-meta">👤 {foundItem?.userEmail}</p>
        </div>
      </div>

      {/* Actions — at the bottom */}
      <div className="match-actions">
        {status === 'pending' && (
          <>
            <button
              className="btn btn-success"
              onClick={() => onApprove(match.id)}
              disabled={loading}
            >
              ✅ Approve Match
            </button>
            <button
              className="btn btn-danger"
              onClick={() => onReject(match.id)}
              disabled={loading}
            >
              ❌ Reject Match
            </button>
          </>
        )}
      </div>
    </div>
  );
}