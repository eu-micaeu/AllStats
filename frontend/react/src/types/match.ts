export type GameType = 'League of Legends' | 'Counter-Strike 2' | 'Valorant' | 'Overwatch';

export interface Team {
  id: string;
  name: string;
  logo: string;
  score: number;
}

export interface Match {
  id: string;
  game: GameType;
  teamA: Team;
  teamB: Team;
  status: 'live' | 'finished' | 'upcoming';
  gameTime: string;
  startTime?: string;
}
