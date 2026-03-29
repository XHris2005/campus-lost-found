import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { submitClaim } from '../../api/claimApi';

export default function ClaimItem() {
  const [verificationDetails, setVerificationDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Match details passed via navigation state
  const { matchId, lostItemId, foundItemId, lostItemName } =
    location.state || {};

  useEffect(() => {
    if (!matchId) {
      navigate('/dashboard');
    }
  }, [matchId, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (verificationDetails.trim().length < 20) {
      return setError('Please provide more detail to verify ownership (at least 20 characters).');
    }
    setError('');
    setLoading(true);
    try {
      await submitClaim({
        matchId,
        lostItemId,
        foundItemId,
        verificationDetails,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>Claim Submitted!</h2>
          <p style={styles.successText}>
            Your claim has been submitted successfully. An administrator will
            review your verification details and contact you shortly.
          </p>
          <button
            style={styles.button}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Claim Your Item</h2>
        <p style={styles.subtitle}>
          Submitting a claim for: <strong>{lostItemName || 'your lost item'}</strong>
        </p>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            📋 To verify ownership, please provide specific details that only
            the true owner would know — such as unique markings, contents,
            purchase details, serial numbers, or any other identifying
            information about the item.
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Verification Details
          </label>
          <textarea
            style={styles.textarea}
            placeholder="Describe specific details that prove this item belongs to you. For example: 'The bag has a red keychain on the left zip, initials C.E. written inside the front pocket, and contains a blue USB drive and two notebooks with my name...'"
            value={verificationDetails}
            onChange={(e) => setVerificationDetails(e.target.value)}
            required
          />
          <span style={styles.charCount}>
            {verificationDetails.length} characters
            {verificationDetails.length < 20 && ' (minimum 20)'}
          </span>

          <button
            style={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Claim'}
          </button>
          <button
            style={styles.cancelButton}
            type="button"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '2rem',
  },
  card: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '540px',
  },
  title: { margin: '0 0 0.25rem', fontSize: '1.6rem', color: '#1a1a2e' },
  subtitle: { margin: '0 0 1.5rem', color: '#666', fontSize: '0.9rem' },
  infoBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
  },
  infoText: { margin: 0, fontSize: '0.85rem', color: '#1d4ed8', lineHeight: '1.5' },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  label: { fontSize: '0.9rem', fontWeight: '600', color: '#1a1a2e' },
  textarea: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none',
    minHeight: '150px',
    resize: 'vertical',
    lineHeight: '1.5',
  },
  charCount: { fontSize: '0.75rem', color: '#888', marginTop: '-0.25rem' },
  button: {
    padding: '0.75rem',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '600',
  },
  cancelButton: {
    padding: '0.75rem',
    backgroundColor: '#fff',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  successIcon: { fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' },
  successTitle: { textAlign: 'center', color: '#16a34a', margin: '0 0 0.5rem' },
  successText: { textAlign: 'center', color: '#666', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' },
};