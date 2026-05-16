import React from 'react';
import type { Match } from '../types/match';
import '../styles/MatchCard.css';

interface MatchCardProps {
  match: Match;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const getGameClass = () => {
    switch (match.game) {
      case 'League of Legends': return 'game-lol';
      case 'Counter-Strike 2': return 'game-cs2';
      case 'Valorant': return 'game-valorant';
      default: return '';
    }
  };

  const isUpcoming = match.status === 'upcoming';
  const formatStartTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'TBD';
    }
  };

  return (
    <div className={`match-card ${getGameClass()} ${isUpcoming ? 'upcoming' : ''}`}>
      <div className="match-header">
        <span className="game-label">{match.game}</span>
        {match.status === 'live' ? (
          <span className="live-badge">
            <span className="pulse"></span> LIVE
          </span>
        ) : (
          <span className="upcoming-badge">UPCOMING</span>
        )}
      </div>
      
      <div className="match-body">
        <div className="team">
          <div className="team-info">
            {match.teamA.logo && <img src={match.teamA.logo} alt={match.teamA.name} className="team-logo" />}
            <span className="team-name">{match.teamA.name}</span>
          </div>
          {!isUpcoming && <span className="score">{match.teamA.score}</span>}
        </div>
        
        <div className="vs-divider">{isUpcoming ? 'VS' : '-'}</div>
        
        <div className="team">
          {!isUpcoming && <span className="score">{match.teamB.score}</span>}
          <div className="team-info">
            {match.teamB.logo && <img src={match.teamB.logo} alt={match.teamB.name} className="team-logo" />}
            <span className="team-name">{match.teamB.name}</span>
          </div>
        </div>
      </div>
      
      <div className="match-footer">
        <span className="game-time">
          {isUpcoming ? `Starts at ${formatStartTime(match.startTime)}` : match.gameTime}
        </span>
      </div>
    </div>
  );
};

export default MatchCard;
