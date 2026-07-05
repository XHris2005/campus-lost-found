import { FiMapPin, FiCalendar, FiTag, FiPackage } from 'react-icons/fi';
import './ItemCard.css';

export default function ItemCard({ item, type, onClaim }) {
  const isLost = type === 'lost';
  const isMatched = item.status === 'matched';

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  return (
    <div className={`item-card card card-hover ${isMatched ? 'item-card-matched' : ''}`}>
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