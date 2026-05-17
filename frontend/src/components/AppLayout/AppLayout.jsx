import { useState } from 'react';
import Sidebar from '../SideBar/SideBar';
import TopBar from '../TopBar/TopBar';
import './AppLayout.css';

export default function AppLayout({ children, tabCounts = {} }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="app-main">
        <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}