import React from 'react';
import type { User } from '../types/user';

interface HeaderProps {
  user: User | null;
  onAuthClick: () => void;
  onLogout: () => void;
  currentPage: 'matches' | 'tournaments' | 'profile';
  onPageSelect: (page: 'matches' | 'tournaments' | 'profile') => void;
}

const Header: React.FC<HeaderProps> = ({ user, onAuthClick, onLogout, currentPage, onPageSelect }) => {
  return (
    <header className="main-header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo-section" onClick={() => onPageSelect('matches')} style={{ cursor: 'pointer' }}>
            <img src="/iconallstats.png" alt="AllStats Logo" className="header-logo" />
            <span className="logo-text">ALL<span>STATS</span></span>
          </div>
          
          <nav className="main-nav">
            <button 
              className={`nav-link-btn ${currentPage === 'matches' ? 'active' : ''}`}
              onClick={() => onPageSelect('matches')}
            >
              Live Matches
            </button>
            <button 
              className={`nav-link-btn ${currentPage === 'tournaments' ? 'active' : ''}`}
              onClick={() => onPageSelect('tournaments')}
            >
              Tournaments
            </button>
          </nav>

        </div>

        <div className="header-right">
          <nav className="header-nav">
            {user ? (
              <div className="user-profile" onClick={() => onPageSelect('profile')} style={{ cursor: 'pointer' }}>
                <div className="user-info">
                  <div className="user-avatar" style={{ border: currentPage === 'profile' ? '2px solid var(--accent-color)' : 'none' }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <span className="username" style={{ color: currentPage === 'profile' ? 'white' : 'inherit' }}>{user.username}</span>
                    <span className="user-status">Account & Favs</span>
                  </div>
                </div>
                <button className="logout-btn-minimal" onClick={(e) => { e.stopPropagation(); onLogout(); }} title="Logout">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            ) : (
              <button className="auth-btn" onClick={onAuthClick}>
                Sign In
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
