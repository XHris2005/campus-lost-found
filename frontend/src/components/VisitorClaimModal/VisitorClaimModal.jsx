import { useState, useEffect } from 'react';
import { submitVisitorClaim } from '../../api/visitorApi';
import {
  FiX, FiShield, FiAlertCircle, FiFileText, FiCheckCircle,
} from 'react-icons/fi';
import '../../components/ClaimModal/ClaimModal.css';

export default function VisitorClaimModal({ foundItem, token, onClose }) {
  const [verificationDetails, setVerificationDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiScore, setAiScore] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (verificationDetails.trim().length < 20) {
      return setError('Please provide at least 20 characters of verification details.');
    }
    setError('');
    setLoading(true);
    try {
      const result = await submitVisitorClaim({
        token,
        foundItemId: foundItem.id,
        verificationDetails,
      });
      setAiScore(result.aiScore);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="claim-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="claim-modal card">
        {/* Header */}
        <div className="claim-modal-header">
          <div className="claim-modal-header-left">
            <div className="claim-modal-icon">
              <FiShield size={20} />
            </div>
            <div>
              <h2 className="claim-modal-title">Claim Found Item</h2>
              <p className="claim-modal-subtitle">{foundItem.name}</p>
            </div>
          </div>
          <button className="claim-modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {success ? (
          <div className="claim-modal-success">
            <FiCheckCircle size={48} color="var(--success)" />
            <h3>Claim Submitted!</h3>
            <p>
              Your claim has been submitted for admin review.
              {aiScore !== null && (
                <> Our AI rated the similarity between your lost item and this found item at <strong>{aiScore}%</strong>.</>
              )}
            </p>
            <p className="claim-modal-success-note">
              We'll email you once an admin reviews your claim.
            </p>
            <button className="btn btn-primary btn-full" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="claim-modal-body">
            {/* Found item preview */}
            <div className="claim-modal-found-preview">
              {foundItem.imageURL && (
                <img src={foundItem.imageURL} alt={foundItem.name} className="claim-modal-found-img" />
              )}
              <div className="claim-modal-found-info">
                <p className="claim-modal-found-name">{foundItem.name}</p>
                <p className="claim-modal-found-desc">{foundItem.description}</p>
                <p className="claim-modal-found-location">📍 {foundItem.location}</p>
              </div>
            </div>

            {/* Info alert */}
            <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
              <FiAlertCircle size={14} />
              <span>Provide specific details only the true owner would know — unique marks, contents, serial numbers, or purchase history.</span>
            </div>

            {error && (
              <div className="alert alert-error">
                <FiAlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Verification details */}
            <div className="form-group">
              <label className="form-label">
                <FiFileText size={14} /> Verification Details
              </label>
              <textarea
                className="form-textarea"
                placeholder="Describe unique details only you would know — markings, contents, serial numbers, colour of straps, what's inside, etc..."
                value={verificationDetails}
                onChange={(e) => setVerificationDetails(e.target.value)}
                rows={5}
                required
              />
              <span className={`claim-char-count ${verificationDetails.length < 20 ? 'count-low' : 'count-ok'}`}>
                {verificationDetails.length} characters
                {verificationDetails.length < 20 && ` (${20 - verificationDetails.length} more needed)`}
              </span>
            </div>

            {/* Actions */}
            <div className="claim-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || verificationDetails.trim().length < 20}
              >
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}