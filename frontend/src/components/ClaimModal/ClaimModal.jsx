import { useState, useEffect } from 'react';
import { getLostItems } from '../../api/itemApi';
import { submitManualClaim } from '../../api/claimApi';
import { useAuth } from '../../context/AuthContext';
import {
  FiX, FiShield, FiAlertCircle, FiFileText,
  FiCheckCircle, FiChevronDown,
} from 'react-icons/fi';
import './ClaimModal.css';

export default function ClaimModal({ foundItem, onClose }) {
  const { currentUser } = useAuth();
  const [myLostItems, setMyLostItems] = useState([]);
  const [selectedLostItemId, setSelectedLostItemId] = useState('');
  const [verificationDetails, setVerificationDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiScore, setAiScore] = useState(null);

  useEffect(() => {
    async function fetchMyLostItems() {
      try {
        const all = await getLostItems();
        const mine = all.filter(
          (i) => i.userId === currentUser?.uid && i.status === 'active'
        );
        setMyLostItems(mine);
        if (mine.length === 1) setSelectedLostItemId(mine[0].id);
      } catch (err) {
        setError('Could not load your lost items.');
      }
      setFetchingItems(false);
    }
    fetchMyLostItems();
  }, [currentUser]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedLostItemId) return setError('Please select which lost item you are claiming.');
    if (verificationDetails.trim().length < 20) {
      return setError('Please provide at least 20 characters of verification details.');
    }
    setError('');
    setLoading(true);
    try {
      const result = await submitManualClaim({
        foundItemId: foundItem.id,
        lostItemId: selectedLostItemId,
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
              You will be notified once an admin reviews your claim.
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

            {/* Lost item selector */}
            <div className="form-group">
              <label className="form-label">
                <FiFileText size={14} /> Which lost item is this?
              </label>
              {fetchingItems ? (
                <p className="claim-modal-loading">Loading your lost items...</p>
              ) : myLostItems.length === 0 ? (
                <div className="alert alert-error">
                  You have no active lost item reports. Please report your lost item first before submitting a claim.
                </div>
              ) : (
                <div className="claim-select-wrap">
                  <select
                    className="form-input claim-select"
                    value={selectedLostItemId}
                    onChange={(e) => setSelectedLostItemId(e.target.value)}
                    required
                  >
                    <option value="">Select your lost item...</option>
                    {myLostItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {item.category} — {item.location}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="claim-select-icon" size={16} />
                </div>
              )}
            </div>

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
                disabled={loading || myLostItems.length === 0 || verificationDetails.trim().length < 20 || !selectedLostItemId}
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