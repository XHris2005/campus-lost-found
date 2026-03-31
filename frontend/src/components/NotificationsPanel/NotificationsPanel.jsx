import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import useNotifications from '../../hooks/useNotifications';
import './NotificationsPanel.css';

export default function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const panelRef = useRef(null);
  const navigate = useNavigate();

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
    const diff = Date.now() - new Date(createdAt);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'match_found': return '🎯';
      case 'match_approved': return '✅';
      case 'match_rejected': return '❌';
      case 'chat_created': return '💬';
      case 'chat_completed': return '🎉';
      case 'claim_verified': return '🏆';
      case 'claim_rejected': return '❌';
      default: return '📢';
    }
  }

  return (
    <div className="notif-wrapper" ref={panelRef}>
      <button
        className="notif-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-panel card">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <FiBell size={24} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notif-item ${!notification.isRead ? 'notif-item-unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notif-item-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notif-item-body">
                    <p className="notif-item-message">{notification.message}</p>
                    <span className="notif-item-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <div className="notif-unread-dot" />
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