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

export const updateProfilePicture = async (userId: string, pictureData: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/user/${userId}/profile-picture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pictureData })
  });
  if (!response.ok) {
    throw new Error('Failed to update profile picture');
  }
};

export const addFavoriteTournament = async (userId: string, tournamentId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/user/${userId}/favorites/${tournamentId}`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Failed to favorite tournament');
  }
};

export const removeFavoriteTournament = async (userId: string, tournamentId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/user/${userId}/favorites/${tournamentId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to remove favorite');
  }
};
