import type { Match } from '../types/match';
import type { Tournament } from '../types/tournament';
import type { TeamSimple } from '../types/user';

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

export const fetchLeagueDetails = async (id: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/leagues/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch league details');
  }
  return await response.json();
};

export const fetchSeriesTeams = async (id: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/series/${id}/teams`);
  if (!response.ok) {
    throw new Error('Failed to fetch series teams');
  }
  const data = await response.json();
  return data.teams;
};

export const fetchSeriesMatches = async (id: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/series/${id}/matches`);
  if (!response.ok) {
    throw new Error('Failed to fetch series matches');
  }
  const data = await response.json();
  return data.matches;
};

export const fetchSeriesInfo = async (id: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/series/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch series info');
  }
  return await response.json();
};

export const fetchTournamentStandings = async (id: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/tournaments/${id}/standings`);
  if (!response.ok) {
    throw new Error('Failed to fetch tournament standings');
  }
  return await response.json();
};

export const fetchTournamentBrackets = async (id: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/tournaments/${id}/brackets`);
  if (!response.ok) {
    throw new Error('Failed to fetch tournament brackets');
  }
  return await response.json();
};

export const fetchSeriesStandings = async (id: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/series/${id}/standings`);
  if (!response.ok) {
    throw new Error('Failed to fetch series standings');
  }
  const data = await response.json();
  return data.standings;
};

export const searchTeams = async (query: string): Promise<TeamSimple[]> => {
  const response = await fetch(`${API_BASE}/teams/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search teams');
  }
  const data = await response.json();
  return data.teams;
};

export const fetchUserFavorites = async (userId: string): Promise<TeamSimple[]> => {
  const response = await fetch(`${API_BASE}/user/${userId}/favorites`);
  if (!response.ok) {
    throw new Error('Failed to fetch favorites');
  }
  const data = await response.json();
  return data.favorites || [];
};

export const updateUserFavorites = async (userId: string, favorites: TeamSimple[]): Promise<void> => {
  const response = await fetch(`${API_BASE}/user/${userId}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(favorites)
  });
  if (!response.ok) {
    throw new Error('Failed to update favorites');
  }
};

export const fetchFavoriteMatches = async (userId: string): Promise<Match[]> => {
  const response = await fetch(`${API_BASE}/user/${userId}/favorite-matches`);
  if (!response.ok) {
    throw new Error('Failed to fetch favorite matches');
  }
  const data = await response.json();
  return data.matches;
};
