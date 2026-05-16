import React from 'react';
import type { GameType } from '../types/match';

interface GameFilterProps {
  selectedGame: GameType;
  onGameSelect: (game: GameType) => void;
}
const games: { type: GameType; label: string; color: string; icon: string }[] = [
  { type: 'Counter-Strike 2', label: 'CS2', color: 'var(--cs2-color)', icon: '/logocs2.png' },
  { type: 'Valorant', label: 'Valorant', color: 'var(--valorant-color)', icon: '/logoval.png' },
  { type: 'League of Legends', label: 'LoL', color: 'var(--lol-color)', icon: '/logolol.png' },
];

const GameFilter: React.FC<GameFilterProps> = ({ selectedGame, onGameSelect }) => {
  return (
    <div className="game-filter">
      {games.map((game) => (
        <button
          key={game.type}
          className={`game-filter-btn ${selectedGame === game.type ? 'active' : ''}`}
          onClick={() => onGameSelect(game.type)}
          style={{ '--game-color': game.color } as React.CSSProperties}
        >
          <div className="game-icon-wrapper">
            <img src={game.icon} alt={game.label} className="game-icon-img" />
          </div>
        </button>
      ))}
    </div>
  );
};



export default GameFilter;
