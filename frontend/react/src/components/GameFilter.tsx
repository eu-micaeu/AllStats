import React from 'react';
import type { GameType } from '../types/match';

interface GameFilterProps {
  selectedGame: GameType | 'All';
  onGameSelect: (game: GameType | 'All') => void;
}
const games: { type: GameType | 'All'; label: string; color: string }[] = [
  { type: 'All', label: 'All Games', color: 'var(--accent-color)' },
  { type: 'Counter-Strike 2', label: 'CS 2', color: 'var(--cs2-color)' },
  { type: 'Valorant', label: 'Valorant', color: 'var(--valorant-color)' },
  { type: 'Overwatch', label: 'Overwatch', color: '#f99e1a' },
  { type: 'League of Legends', label: 'LoL', color: 'var(--lol-color)' },
];

const GameFilter: React.FC<GameFilterProps> = ({ selectedGame, onGameSelect }) => {
  return (
    <div className="game-filter-container">
      {games.map((game) => (
        <button
          key={game.type}
          className={`game-filter-btn ${selectedGame === game.type ? 'active' : ''}`}
          onClick={() => onGameSelect(game.type)}
          style={{ '--game-color': game.color } as React.CSSProperties}
        >
          <span className="game-label">{game.label}</span>
        </button>
      ))}
    </div>
  );
};


export default GameFilter;
