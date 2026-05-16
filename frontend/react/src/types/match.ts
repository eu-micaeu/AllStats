export type GameType = 'League of Legends' | 'Counter-Strike 2' | 'Valorant';

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
  stage?: string;
  leagueName?: string;
  currentGame?: number;
  numberOfGames?: number;
  currentMapScoreA?: number;
  currentMapScoreB?: number;
}

