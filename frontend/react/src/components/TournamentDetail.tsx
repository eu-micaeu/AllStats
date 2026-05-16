import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { fetchLeagueDetails } from '../services/api';
import '../styles/TournamentDetail.css';

interface TournamentDetailProps {
  tournamentId: string;
  onBack: () => void;
  onSeriesClick: (id: string, name: string) => void;
}

const TournamentDetail: React.FC<TournamentDetailProps> = ({ tournamentId, onBack, onSeriesClick }) => {
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await fetchLeagueDetails(tournamentId);
        setLeague(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load league details', err);
        setLoading(false);
      }
    };
    loadDetails();
  }, [tournamentId]);

  if (loading) return <div className="loading-detail">Loading league details...</div>;
  if (!league) return <div className="loading-detail">League not found.</div>;

  const sortedSeries = league.series ? [...league.series].sort((a: any, b: any) => 
    new Date(b.begin_at).getTime() - new Date(a.begin_at).getTime()
  ) : [];

  return (
    <div className="tournament-detail">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={20} />
        Back to Tournaments
      </button>

      <div className="detail-header">
        <div className="detail-logo-container">
          {league.image_url ? (
            <img src={league.image_url} alt={league.name} className="detail-logo" />
          ) : (
            <div style={{ fontSize: '2rem' }}>🏆</div>
          )}
        </div>
        <div className="detail-title-section">
          <span className="detail-game-badge">{league.videogame?.name}</span>
          <h1>{league.name}</h1>
          {league.url && (
            <a href={league.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              Official Website <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {sortedSeries.length > 0 && (
        <div className="detail-section">
          <h2>Seasons / Series</h2>
          <div className="series-list">
            {sortedSeries.map((s: any) => (
              <div 
                key={s.id} 
                className="series-card" 
                onClick={() => onSeriesClick(s.id, s.full_name || s.name || `Season ${s.year}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="series-name">{s.full_name || s.name || `Season ${s.year}`}</div>
                <div className="series-date">
                  {new Date(s.begin_at).toLocaleDateString()} - {s.end_at ? new Date(s.end_at).toLocaleDateString() : 'Ongoing'}
                </div>
                {s.winner_id && <div className="series-full-name">Champion Awarded</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetail;
