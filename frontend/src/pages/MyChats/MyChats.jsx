import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyChats } from '../../api/chatApi';
import {
  FiMessageSquare, FiClock, FiCheckCircle,
  FiArrowRight, FiUser,
} from 'react-icons/fi';
import './MyChats.css';

export default function MyChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchChats() {
      try {
        const data = await getMyChats();
        setChats(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchChats();
  }, []);

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  return (
    <div className="mychats-page">
      <div className="mychats-header">
        <div>
          <h1 className="page-title">My Chats</h1>
          <p className="mychats-subtitle">
            Active recovery chats between you and item finders or owners
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading chats...</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h3>No active chats</h3>
          <p>
            Chats are created automatically when an admin approves
            a match between a lost and found item.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/listings')}
          >
            Browse Listings
          </button>
        </div>
      ) : (
        <div className="chats-list">
          {chats.map((chat) => {
            const isCompleted = chat.status === 'completed';
            const bothConfirmed = chat.ownerConfirmed && chat.finderConfirmed;

            return (
              <div
  key={chat.id}
  className={`chat-card card card-hover ${isCompleted ? 'chat-card-completed' : ''}`}
  onClick={() => navigate(`/chat/${chat.id}`)}
>
  {/* Item image as profile */}
  <div className="chat-card-img">
    {chat.lostItem?.imageURL ? (
      <img src={chat.lostItem.imageURL} alt={chat.lostItem.name} />
    ) : (
      <FiMessageSquare size={22} />
    )}
  </div>

  <div className="chat-card-info">
    <div className="chat-card-title-row">
      <h3 className="chat-card-title">
        {chat.lostItem?.name || 'Item Return Chat'}
      </h3>
      <span className={`badge ${isCompleted ? 'badge-success' : 'badge-warning'}`}>
        {isCompleted ? 'Completed' : 'Active'}
      </span>
    </div>
    <div className="chat-card-meta">
      <span><FiClock size={12} /> Created {formatDate(chat.createdAt)}</span>
      {chat.lostItem?.category && (
        <span>🏷️ {chat.lostItem.category}</span>
      )}
    </div>
    <div className="chat-confirmations">
      <span className={`confirm-item ${chat.ownerConfirmed ? 'confirmed' : ''}`}>
        Owner {chat.ownerConfirmed ? '✅' : '⏳'}
      </span>
      <span className={`confirm-item ${chat.finderConfirmed ? 'confirmed' : ''}`}>
        Finder {chat.finderConfirmed ? '✅' : '⏳'}
      </span>
    </div>
  </div>

  <FiArrowRight size={18} className="chat-card-arrow" />
</div>
            );
          })}
        </div>
      )}
    </div>
  );
}