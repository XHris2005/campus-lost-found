export default function ClaimCard({ claim, onVerify, onReject, loading }) {
  const { lostItem, verificationDetails, status, claimantEmail, createdAt } = claim;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.itemName}>{lostItem?.name || 'Unknown Item'}</h3>
          <p style={styles.claimant}>Claimed by: <strong>{claimantEmail}</strong></p>
          <p style={styles.date}>
            Submitted: {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
        <span style={{
          ...styles.statusBadge,
          backgroundColor:
            status === 'verified' ? '#dcfce7' :
            status === 'rejected' ? '#fee2e2' : '#fef9c3',
          color:
            status === 'verified' ? '#16a34a' :
            status === 'rejected' ? '#dc2626' : '#b45309',
        }}>
          {status}
        </span>
      </div>

      {lostItem?.imageURL && (
        <img
          src={lostItem.imageURL}
          alt={lostItem.name}
          style={styles.image}
        />
      )}

      <div style={styles.verificationBox}>
        <p style={styles.verificationLabel}>Owner's Verification Details:</p>
        <p style={styles.verificationText}>{verificationDetails}</p>
      </div>

      {status === 'pending' && (
        <div style={styles.actions}>
          <button
            style={styles.verifyButton}
            onClick={() => onVerify(claim.id)}
            disabled={loading}
          >
            ✅ Verify & Release
          </button>
          <button
            style={styles.rejectButton}
            onClick={() => onReject(claim.id)}
            disabled={loading}
          >
            ❌ Reject Claim
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  itemName: { margin: '0 0 0.25rem', fontSize: '1.1rem', color: '#1a1a2e' },
  claimant: { margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#666' },
  date: { margin: 0, fontSize: '0.8rem', color: '#888' },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'capitalize',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  verificationBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
  },
  verificationLabel: {
    margin: '0 0 0.5rem',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  verificationText: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#333',
    lineHeight: '1.6',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  verifyButton: {
    padding: '0.6rem 1.5rem',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: '600',
  },
  rejectButton: {
    padding: '0.6rem 1.5rem',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: '600',
  },
};