import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { submitClaim } from '../../api/claimApi';
import {
  FiShield, FiCheckCircle, FiArrowRight,
  FiAlertCircle, FiFileText,
} from 'react-icons/fi';
import './ClaimItem.css';

export default function ClaimItem() {
  const [verificationDetails, setVerificationDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { matchId, lostItemId, foundItemId, lostItemName } =
    location.state || {};

  useEffect(() => {
    if (!matchId) navigate('/dashboard');
  }, [matchId, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (verificationDetails.trim().length < 20) {
      return setError('Please provide more detail — at least 20 characters required.');
    }
    setError('');
    setLoading(true);
    try {
      await submitClaim({ matchId, lostItemId, foundItemId, verificationDetails });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="claim-success-wrap">
        <div className="claim-success card">
          <div className="claim-success-icon">
            <FiCheckCircle size={36} />
          </div>
          <h2>Claim Submitted!</h2>
          <p>
            Your ownership claim has been submitted successfully.
            An administrator will review your verification details
            and notify you of the outcome shortly.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="claim-page">
      {/* Header */}
      <div className="claim-header">
        <div className="claim-header-icon">
          <FiShield size={22} />
        </div>
        <div>
          <h1 className="claim-title">Claim Your Item</h1>
          <p className="claim-subtitle">
            Submitting a claim for: <strong>{lostItemName || 'your lost item'}</strong>
          </p>
        </div>
      </div>

      <div className="claim-layout">
        {/* Form */}
        <div className="claim-form-card card">
          <div className="alert alert-info claim-info-alert">
            <FiAlertCircle size={16} />
            <div>
              <strong>How to verify ownership</strong>
              <p>
                Provide specific details that only the true owner would know —
                unique markings, contents, serial numbers, purchase history,
                or any other identifying information.
              </p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="claim-form">
            <div className="form-group">
              <label className="form-label">
                <FiFileText size={14} /> Verification Details
              </label>
              <textarea
                className="form-textarea claim-textarea"
                placeholder="Example: The bag has a red keychain on the left zip, my initials C.E. are written inside the front pocket, it contains a blue USB drive and two notebooks with my name on the cover..."
                value={verificationDetails}
                onChange={(e) => setVerificationDetails(e.target.value)}
                required
                rows={6}
              />
              <div className="claim-char-row">
                <span className={`claim-char-count ${verificationDetails.length < 20 ? 'count-low' : 'count-ok'}`}>
                  {verificationDetails.length} characters
                  {verificationDetails.length < 20 && ` (${20 - verificationDetails.length} more needed)`}
                </span>
              </div>
            </div>

            <div className="claim-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/listings')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || verificationDetails.trim().length < 20}
              >
                {loading ? 'Submitting...' : 'Submit Claim'}
                {!loading && <FiArrowRight size={16} />}
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="claim-info-panel">
          <div className="card claim-steps-card">
            <h3 className="claim-steps-title">What happens next?</h3>
            <div className="claim-steps">
              {[
                {
                  step: '01',
                  icon: '📋',
                  title: 'Claim Reviewed',
                  desc: 'An admin reviews your verification details carefully.',
                },
                {
                  step: '02',
                  icon: '✅',
                  title: 'Identity Verified',
                  desc: 'If verified, you will be notified to collect your item.',
                },
                {
                  step: '03',
                  icon: '🎉',
                  title: 'Item Collected',
                  desc: 'Visit the Lost & Found office with your student ID to collect.',
                },
              ].map((s) => (
                <div key={s.step} className="claim-step">
                  <div className="claim-step-num">{s.step}</div>
                  <div className="claim-step-icon">{s.icon}</div>
                  <div>
                    <p className="claim-step-title">{s.title}</p>
                    <p className="claim-step-desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card claim-warning-card">
            <FiAlertCircle size={20} className="warning-icon" />
            <div>
              <p className="warning-title">Important Notice</p>
              <p className="warning-desc">
                False claims are a violation of university policy.
                Ensure all details you provide are accurate and truthful.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}