import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatMessages, sendMessage, confirmReturn } from '../../api/chatApi';
import { useAuth } from '../../context/AuthContext';
import {
  FiSend, FiCheckCircle, FiArrowLeft,
  FiUser, FiAlertCircle,
} from 'react-icons/fi';
import './Chat.css';

export default function Chat() {
  const { chatId } = useParams();
  const { currentUser } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [confirmMsg, setConfirmMsg] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    try {
      const data = await getChatMessages(chatId);
      setChat(data.chat);
      setMessages(data.messages);
      setLoading(false);
    } catch (err) {
      setError('Could not load chat');
      setLoading(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(chatId, text);
      setText('');
      await fetchMessages();
    } catch (err) {
      setError('Could not send message');
    }
    setSending(false);
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      const result = await confirmReturn(chatId);
      if (result.completed) {
        setConfirmMsg('✅ Both parties confirmed! Chat completed successfully.');
        await fetchMessages();
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        setConfirmMsg('✅ Your confirmation recorded. Waiting for the other party.');
        await fetchMessages();
      }
    } catch (err) {
      setError('Could not confirm return');
    }
    setConfirming(false);
  }

  const isOwner = chat?.ownerId === currentUser?.uid;
  const isFinder = chat?.finderId === currentUser?.uid;
  const isAdminViewing = !isOwner && !isFinder;
  const myConfirmed = isOwner ? chat?.ownerConfirmed : chat?.finderConfirmed;
  const isCompleted = chat?.status === 'completed';

  function formatTime(createdAt) {
    return new Date(createdAt).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Chat Header */}
      <div className="chat-header card">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/my-chats')}
        >
          <FiArrowLeft size={16} /> Back
        </button>
        <div className="chat-header-info">
          <div className="chat-header-avatar">
  {chat?.lostItemImage ? (
    <img
      src={chat.lostItemImage}
      alt="Item"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  ) : (
    <FiUser size={18} />
  )}
</div>
          <div>
            <h2 className="chat-header-title">
  {isAdminViewing
    ? '👁️ Monitoring Chat'
    : `${chat?.lostItemName || 'Item'} Recovery`}
</h2>
            <span className={`badge ${isCompleted ? 'badge-success' : 'badge-warning'}`}>
              {isCompleted ? 'Completed' : 'Active'}
            </span>
          </div>
        </div>
        <div className="chat-header-confirmations">
          <span className={chat?.ownerConfirmed ? 'confirmed-text' : 'pending-text'}>
            Owner {chat?.ownerConfirmed ? '✅' : '⏳'}
          </span>
          <span className={chat?.finderConfirmed ? 'confirmed-text' : 'pending-text'}>
            Finder {chat?.finderConfirmed ? '✅' : '⏳'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages card">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Start the conversation to arrange item collection</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.senderId === 'system';
            const isMe = msg.senderId === currentUser?.uid;

            if (isSystem) {
              return (
                <div key={msg.id} className="system-message">
                  <FiAlertCircle size={14} />
                  <p>{msg.text}</p>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`message-row ${isMe ? 'message-row-me' : 'message-row-them'}`}
              >
                {!isMe && (
                  <div className="message-avatar">
                    {msg.senderName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`message-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                  {!isMe && (
                    <span className="message-sender">{msg.senderName}</span>
                  )}
                  <p className="message-text">{msg.text}</p>
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Confirmation Section */}
      {!isCompleted && (isOwner || isFinder) && (
        <div className="chat-confirm card">
          {confirmMsg && (
            <div className="alert alert-success">{confirmMsg}</div>
          )}
          {!myConfirmed ? (
            <button
              className="btn btn-success btn-full"
              onClick={handleConfirm}
              disabled={confirming}
            >
              <FiCheckCircle size={18} />
              {confirming ? 'Confirming...' : 'I confirm the item has been returned'}
            </button>
          ) : (
            <p className="waiting-text">
              ⏳ Your confirmation recorded. Waiting for the other party...
            </p>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="chat-completed card">
          <FiCheckCircle size={20} />
          <p>This chat has been completed. Thank you!</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Input */}
      {!isCompleted && !isAdminViewing && (
        <form onSubmit={handleSend} className="chat-input-form card">
          <input
            className="chat-input"
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
          />
          <button
            className="btn btn-primary chat-send-btn"
            type="submit"
            disabled={sending || !text.trim()}
          >
            <FiSend size={18} />
          </button>
        </form>
      )}

      {isAdminViewing && (
        <div className="admin-view-notice card">
          👁️ You are viewing this chat as an administrator — read only
        </div>
      )}
    </div>
  );
}