import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationsPanel from '../NotificationsPanel/NotificationsPanel';
import { FiSun, FiMoon, FiMenu } from 'react-icons/fi';
import './TopBar.css';

export default function TopBar({ onMenuToggle }) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-menu-btn"
          onClick={onMenuToggle}
          title="Toggle menu"
        >
          <FiMenu size={22} />
        </button>
        <div className="topbar-greeting">
          <p className="topbar-greeting-text">
            Welcome back,{' '}
            <strong>{currentUser?.displayName?.split(' ')[0]}</strong> 👋
          </p>
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="topbar-icon-btn"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
        </button>
        <NotificationsPanel />
      </div>
    </header>
  );
}