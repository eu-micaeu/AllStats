import type { Match } from '../types/match';
import type { Tournament } from '../types/tournament';

const API_BASE = '/api';

export const fetchMatches = async (): Promise<Match[]> => {
  const response = await fetch(`${API_BASE}/matches`);
  if (!response.ok) {
    throw new Error('Failed to fetch matches');
  }
  const data = await response.json();
  return data.matches;
};

export const fetchTournaments = async (): Promise<Tournament[]> => {
  const response = await fetch(`${API_BASE}/tournaments`);
  if (!response.ok) {
    throw new Error('Failed to fetch tournaments');
  }
  const data = await response.json();
  return data.tournaments;
};
