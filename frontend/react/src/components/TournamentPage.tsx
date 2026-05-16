import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Tournament } from '../types/tournament';
import { fetchTournaments } from '../services/api';
import '../styles/TournamentPage.css';

interface TournamentPageProps {
  onTournamentClick: (id: string) => void;
}

const TournamentPage: React.FC<TournamentPageProps> = ({ onTournamentClick }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredTournaments = tournaments.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.league.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.game.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGameColor = (game: string) => {
    switch (game) {
      case 'Counter-Strike 2': return 'var(--cs2-color)';
      case 'Valorant': return 'var(--valorant-color)';
      case 'League of Legends': return 'var(--lol-color)';
      case 'Overwatch': return '#f99e1a';
      default: return 'var(--accent-color)';
    }
  };

  if (loading) return <div className="container">Loading tournaments...</div>;

  return (
    <div className="tournament-page">
      <div className="search-container">
        <Search className="search-icon" style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          placeholder="Search tournaments by name, league or game..."
          className="search-input"
          style={{ paddingLeft: '3.5rem' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
              <h3 className="tournament-name">{tournament.name}</h3>
            </div>
          ))
        ) : (
          <div className="no-results">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            No tournaments found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentPage;
