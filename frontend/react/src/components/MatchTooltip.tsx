import React from 'react';
import type { Match } from '../types/match';

interface MatchTooltipProps {
  match: Match;
}

const MatchTooltip: React.FC<MatchTooltipProps> = ({ match }) => {
  return (
    <div className="match-tooltip">
      <div className="tooltip-header">{match.game} • {match.stage || 'Match'}</div>
      <div className="tooltip-content">
        <div className="tooltip-teams">
          <div className="tooltip-team">
            {match.teamA.logo ? (
              <img src={match.teamA.logo} alt="" className="tooltip-logo" />
            ) : (
              <div className="tooltip-logo" style={{ fontSize: '1.5rem' }}>🛡️</div>
            )}
            <span className="tooltip-team-name">{match.teamA.name}</span>
          </div>
          <div className="tooltip-score-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em', lineHeight: 1 }}>
              {match.teamA.score} - {match.teamB.score}
            </div>
            {match.numberOfGames && match.numberOfGames > 0 && (
              <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, marginTop: '0.2rem' }}>
                Best of {match.numberOfGames}
              </div>
            )}
          </div>

          <div className="tooltip-team">
            {match.teamB.logo ? (
              <img src={match.teamB.logo} alt="" className="tooltip-logo" />
            ) : (
              <div className="tooltip-logo" style={{ fontSize: '1.5rem' }}>🛡️</div>
            )}
            <span className="tooltip-team-name">{match.teamB.name}</span>
          </div>
        </div>
        <div className="tooltip-footer">
          <span style={{ 
            color: match.status === 'live' ? 'var(--live-color)' : 'var(--text-secondary)', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            fontSize: '0.65rem' 
          }}>
            {match.status === 'live' ? (
              <>Ongoing Match • Map {match.currentGame || '?'}</>
            ) : match.status === 'upcoming' ? (
              'Upcoming Match'
            ) : (
              'Match Finished'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MatchTooltip;
