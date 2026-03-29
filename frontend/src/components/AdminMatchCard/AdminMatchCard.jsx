export default function AdminMatchCard({ match, onApprove, onReject, loading }) {
  const { lostItem, foundItem, combinedScore, status } = match;

  const scorePercent = Math.round((combinedScore || 0) * 100);
  const scoreColor =
    scorePercent >= 85 ? '#16a34a' :
    scorePercent >= 70 ? '#d97706' : '#dc2626';

  return (
    <div style={styles.card}>
      {/* Score Badge */}
      <div style={styles.scoreRow}>
        <span style={styles.matchLabel}>AI Match Score</span>
        <span style={{ ...styles.scoreBadge, color: scoreColor, borderColor: scoreColor }}>
          {scorePercent}% match
        </span>
        <span style={{
          ...styles.statusBadge,
          backgroundColor:
            status === 'approved' ? '#dcfce7' :
            status === 'rejected' ? '#fee2e2' : '#fef9c3',
          color:
            status === 'approved' ? '#16a34a' :
            status === 'rejected' ? '#dc2626' : '#b45309',
        }}>
          {status}
        </span>
      </div>

      {/* Items Comparison */}
      <div style={styles.comparison}>
        {/* Lost Item */}
        <div style={styles.itemBox}>
          <span style={styles.itemLabel}>🔍 Lost Item</span>
          {lostItem?.imageURL && (
            <img src={lostItem.imageURL} alt={lostItem.name} style={styles.image} />
          )}
          <p style={styles.itemName}>{lostItem?.name || 'Unknown'}</p>
          <p style={styles.itemDetail}>{lostItem?.description}</p>
          <p style={styles.itemMeta}>📍 {lostItem?.location}</p>
          <p style={styles.itemMeta}>🏷️ {lostItem?.category}</p>
          <p style={styles.itemMeta}>👤 {lostItem?.userEmail}</p>
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.vsText}>VS</span>
        </div>

        {/* Found Item */}
        <div style={styles.itemBox}>
          <span style={styles.itemLabel}>📦 Found Item</span>
          {foundItem?.imageURL && (
            <img src={foundItem.imageURL} alt={foundItem.name} style={styles.image} />
          )}
          <p style={styles.itemName}>{foundItem?.name || 'Unknown'}</p>
          <p style={styles.itemDetail}>{foundItem?.description}</p>
          <p style={styles.itemMeta}>📍 {foundItem?.location}</p>
          <p style={styles.itemMeta}>🏷️ {foundItem?.category}</p>
          <p style={styles.itemMeta}>👤 {foundItem?.userEmail}</p>
        </div>
      </div>

      {/* Action Buttons — only show for pending matches */}
      {status === 'pending' && (
        <div style={styles.actions}>
          <button
            style={styles.approveButton}
            onClick={() => onApprove(match.id)}
            disabled={loading}
          >
            ✅ Approve Match
          </button>
          <button
            style={styles.rejectButton}
            onClick={() => onReject(match.id)}
            disabled={loading}
          >
            ❌ Reject Match
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
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  matchLabel: {
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: '500',
  },
  scoreBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    border: '2px solid',
    fontSize: '0.85rem',
    fontWeight: '700',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  comparison: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '1rem',
    alignItems: 'start',
    marginBottom: '1.25rem',
  },
  itemBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '1rem',
  },
  itemLabel: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '0.5rem',
  },
  image: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '6px',
    marginBottom: '0.5rem',
  },
  itemName: {
    margin: '0 0 0.25rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  itemDetail: {
    margin: '0 0 0.5rem',
    fontSize: '0.8rem',
    color: '#666',
    lineHeight: '1.4',
  },
  itemMeta: {
    margin: '0.2rem 0',
    fontSize: '0.75rem',
    color: '#888',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '3rem',
  },
  vsText: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#999',
    backgroundColor: '#f0f4f8',
    padding: '0.4rem 0.6rem',
    borderRadius: '50%',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  approveButton: {
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