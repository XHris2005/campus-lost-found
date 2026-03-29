import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../../hooks/useNotifications';

export default function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleNotificationClick(notification) {
  markAsRead(notification.id);
  setIsOpen(false);
  navigate('/listings');
}
  function formatTime(createdAt) {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  return (
    <div style={styles.wrapper} ref={panelRef}>
      {/* Bell Button */}
      <button
        style={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={styles.panel}>
          {/* Panel Header */}
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button
                style={styles.markAllButton}
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>
                <p style={styles.emptyText}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    ...styles.item,
                    backgroundColor: notification.isRead ? '#fff' : '#eff6ff',
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div style={styles.itemIcon}>
                    {notification.type === 'match_found' ? '🎯' : '📢'}
                  </div>
                  <div style={styles.itemBody}>
                    <p style={styles.itemMessage}>{notification.message}</p>
                    <span style={styles.itemTime}>
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <div style={styles.unreadDot} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  bellButton: {
    position: 'relative',
    background: 'none',
    border: 'none',
    fontSize: '1.4rem',
    cursor: 'pointer',
    padding: '0.4rem',
    borderRadius: '8px',
    lineHeight: 1,
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#dc2626',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: '700',
    borderRadius: '10px',
    padding: '1px 5px',
    minWidth: '16px',
    textAlign: 'center',
  },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '320px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid #f0f0f0',
  },
  panelTitle: {
    fontWeight: '700',
    fontSize: '0.95rem',
    color: '#1a1a2e',
  },
  markAllButton: {
    background: 'none',
    border: 'none',
    color: '#0369a1',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
  list: {
    maxHeight: '360px',
    overflowY: 'auto',
  },
  empty: {
    padding: '2rem',
    textAlign: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: '0.9rem',
    margin: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  itemIcon: {
    fontSize: '1.2rem',
    flexShrink: 0,
    marginTop: '2px',
  },
  itemBody: {
    flex: 1,
  },
  itemMessage: {
    margin: '0 0 0.25rem',
    fontSize: '0.85rem',
    color: '#1a1a2e',
    lineHeight: '1.4',
  },
  itemTime: {
    fontSize: '0.75rem',
    color: '#888',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#0369a1',
    flexShrink: 0,
    marginTop: '6px',
  },
};