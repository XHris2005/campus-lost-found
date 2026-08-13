import { FiMapPin, FiCalendar, FiTag, FiPackage } from 'react-icons/fi';
import './ItemCard.css';

export default function ItemCard({ item, type, onClaim }) {
  const isLost = type === 'lost';
  const isMatched = item.status === 'matched';
  // Only meaningful for visitor listings, which include a computed
  // `claimable` field from the backend — Listings.jsx items never carry
  // this property, so this badge never appears on the authenticated page.
  const isPendingReview = type === 'found' && item.status === 'active' && item.claimable === false;

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  return (
    <div className={`item-card card card-hover ${isMatched ? 'item-card-matched' : ''} ${isPendingReview ? 'item-card-pending' : ''}`}>
      {/* Image */}
      <div className="item-card-image">
        {item.imageURL ? (
          <img src={item.imageURL} alt={item.name} />
        ) : (
          <div className="item-card-no-image">
            <FiPackage size={32} />
          </div>
        )}
        <span className={`item-type-badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
          {isLost ? '🔍 Lost' : '📦 Found'}
        </span>
        {isMatched && (
          <span className="item-matched-badge">Match Found</span>
        )}
        {isPendingReview && (
          <span className="item-pending-badge">Pending Review</span>
        )}
      </div>

      {/* Body */}
      <div className="item-card-body">
        <div className="item-card-top">
          <span className="item-category">
            <FiTag size={11} /> {item.category}
          </span>
        </div>

        <h3 className="item-name">{item.name}</h3>
        <p className="item-description">{item.description}</p>

        <div className="item-meta">
          <span className="item-meta-item">
            <FiMapPin size={12} /> {item.location}
          </span>
          <span className="item-meta-item">
            <FiCalendar size={12} />
            {formatDate(isLost ? item.dateLost : item.dateFound)}
          </span>
        </div>

        {isPendingReview && (
          <p className="item-pending-notice">
            This item already has a possible match under review.
          </p>
        )}

        {onClaim && (
          <button
            className="btn btn-primary btn-full item-claim-btn"
            onClick={() => onClaim(item)}
          >
            🏷️ Submit Claim
          </button>
        )}
      </div>
    </div>
  );
}