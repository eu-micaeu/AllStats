import type { GameType } from './match';

export interface Tournament {
  id: string;
  name: string;
  game: GameType;
  status: 'running' | 'upcoming' | 'past';
  beginAt: string;
  endAt: string;
  league: string;
  imageUrl: string;
}
