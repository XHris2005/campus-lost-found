import { FiPackage, FiMail, FiCalendar } from 'react-icons/fi';
import './ClaimCard.css';

export default function ClaimCard({ claim, onVerify, onReject, onDelete, loading }) {
  const { lostItem, verificationDetails, status, claimantEmail, createdAt } = claim;

  return (
    <div className="claim-card card">
      <div className="claim-card-header">
        <div className="claim-card-info">
          <div className="claim-card-avatar">
            {lostItem?.imageURL ? (
              <img src={lostItem.imageURL} alt={lostItem?.name} />
            ) : (
              <FiPackage size={20} />
            )}
          </div>
          <div>
            <h3 className="claim-card-name">{lostItem?.name || 'Unknown Item'}</h3>
            <div className="claim-card-meta">
              <span><FiMail size={12} /> {claimantEmail}</span>
              <span>
                <FiCalendar size={12} />
                {new Date(createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <span className={`badge ${
          status === 'verified' ? 'badge-success' :
          status === 'rejected' ? 'badge-error' : 'badge-warning'
        }`}>
          {status}
        </span>
      </div>

      <div className="claim-verification-box">
        <p className="claim-verification-label">Owner's Verification Details</p>
        <p className="claim-verification-text">{verificationDetails}</p>
      </div>

      {status === 'pending' && (
        <div className="claim-card-actions">
          {status === 'pending' && (
          <>
            <button className="btn btn-success" onClick={() => onVerify(claim.id)} disabled={loading}>
              ✅ Verify & Release
            </button>
            <button className="btn btn-danger" onClick={() => onReject(claim.id)} disabled={loading}>
              ❌ Reject Claim
            </button>
          </>
          )}
          <button
            className="btn btn-ghost btn-sm delete-btn"
            onClick={onDelete}
            disabled={loading}
            title="Delete this record"
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
}