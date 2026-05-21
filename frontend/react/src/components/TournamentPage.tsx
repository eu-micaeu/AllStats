import React, { useState, useEffect } from 'react';
import { Search, Star } from 'lucide-react';
import type { Tournament } from '../types/tournament';
import type { User } from '../types/user';
import { fetchTournaments } from '../services/api';
import '../styles/TournamentPage.css';

interface TournamentPageProps {
  onTournamentClick: (id: string) => void;
  user: User | null;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
}

const TournamentPage: React.FC<TournamentPageProps> = ({ onTournamentClick, user, onToggleFavorite }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmedSearch, setConfirmedSearch] = useState('');

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const data = await fetchTournaments();
        setTournaments(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load tournaments', err);
        setLoading(false);
      }
    };
    loadTournaments();
  }, []);

  const handleSearch = () => {
    setConfirmedSearch(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredTournaments = tournaments.filter(t => 
    t.name.toLowerCase().includes(confirmedSearch.toLowerCase()) ||
    t.league.toLowerCase().includes(confirmedSearch.toLowerCase()) ||
    t.game.toLowerCase().includes(confirmedSearch.toLowerCase())
  );

  const getGameColor = (game: string) => {
    switch (game) {
      case 'Counter-Strike 2': return 'var(--cs2-color)';
      case 'Valorant': return 'var(--valorant-color)';
      case 'League of Legends': return 'var(--lol-color)';
      default: return 'var(--accent-color)';
    }
  };

  if (loading) return <div className="container">Loading tournaments...</div>;

  return (
    <div className="tournament-page">
      <div className="search-section">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search tournaments by name, league or game..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            className="search-confirm-btn"
            onClick={handleSearch}
            style={{
              background: 'var(--accent-color)',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              marginLeft: '0.5rem',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Search
          </button>
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => {
                setSearchTerm('');
                setConfirmedSearch('');
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <div className="search-meta">
          {confirmedSearch && (
            <span className="results-count">
              Found {filteredTournaments.length} {filteredTournaments.length === 1 ? 'tournament' : 'tournaments'} for "{confirmedSearch}"
            </span>
          )}
        </div>
      </div>

      <div className="tournament-grid">
        {filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament) => (
            <div 
              key={tournament.id} 
              className="tournament-card" 
              onClick={() => onTournamentClick(tournament.id)}
              style={{ cursor: 'pointer' }}
            >
              <span 
                className="game-badge-compact" 
                style={{ borderLeft: `2px solid ${getGameColor(tournament.game)}`, paddingLeft: '0.5rem' }}
              >
                {tournament.game}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%' }}>
                <h3 className="tournament-name" style={{ margin: 0, flex: 1 }}>{tournament.name}</h3>
                {user && (
                  <button 
                    onClick={(e) => onToggleFavorite(e, tournament.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      color: user.favoriteTournaments?.includes(tournament.id) ? '#fbbf24' : 'var(--text-secondary)',
                      zIndex: 2
                    }}
                  >
                    <Star size={18} fill={user.favoriteTournaments?.includes(tournament.id) ? '#fbbf24' : 'none'} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            No tournaments found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentPage;
