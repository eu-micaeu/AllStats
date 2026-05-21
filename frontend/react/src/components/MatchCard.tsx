import React from 'react';
import type { Match } from '../types/match';
import '../styles/MatchCard.css';

interface MatchCardProps {
  match: Match;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const formatStartTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';

  return (
    <div className={`match-row-hltv ${match.status}`}>
      <div className="match-time">
        {isLive ? (
          <span className="live-indicator">LIVE</span>
        ) : (
          formatStartTime(match.startTime || '')
        )}
      </div>

      <div className="match-teams-section">
        <div className="match-team team-a">
          <span className="team-name">{match.teamA.name}</span>
          {match.teamA.logo && <img src={match.teamA.logo} alt="" className="team-logo-small" />}
        </div>

        <div className={`match-score-box ${isLive ? 'live' : ''}`}>
          {isUpcoming ? (
            <span className="vs-text">VS</span>
          ) : (
            <span className="score-text">{match.teamA.score} - {match.teamB.score}</span>
          )}
        </div>

        <div className="match-team team-b">
          {match.teamB.logo && <img src={match.teamB.logo} alt="" className="team-logo-small" />}
          <span className="team-name">{match.teamB.name}</span>
        </div>
      </div>

      <div className="match-event-info">
        <div className="event-name-wrapper">
          <span className="event-name">{match.leagueName}</span>
          <span className="event-stage">{match.stage || 'Match'}</span>
        </div>
      </div>

    </div>
  );
};

export default MatchCard;
