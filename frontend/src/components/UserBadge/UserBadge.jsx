import { getBadge, getNextBadge, getProgressToNext } from '../../utils/badges';
import './UserBadge.css';

export default function UserBadge({ recoveredCount = 0, showProgress = false, size = 'md' }) {
  const badge = getBadge(recoveredCount);
  const nextBadge = getNextBadge(recoveredCount);
  const progress = getProgressToNext(recoveredCount);

  return (
    <div className={`user-badge-wrap user-badge-${size}`}>
      <span
        className="user-badge"
        style={{
          backgroundColor: badge.bg,
          color: badge.color,
          borderColor: badge.color + '40',
        }}
      >
        {badge.icon} {badge.label}
      </span>

      {showProgress && nextBadge && (
        <div className="badge-progress-wrap">
          <div className="badge-progress-labels">
            <span className="badge-progress-text">
              Progress to {nextBadge.icon} {nextBadge.label}
            </span>
            <span className="badge-progress-count">
              {recoveredCount} / {nextBadge.minReturns} returns
            </span>
          </div>
          <div className="badge-progress-bar">
            <div
              className="badge-progress-fill"
              style={{
                width: `${progress}%`,
                backgroundColor: nextBadge.color,
              }}
            />
          </div>
        </div>
      )}

      {showProgress && !nextBadge && (
        <p className="badge-max-text">🏆 Maximum rank achieved!</p>
      )}
    </div>
  );
}