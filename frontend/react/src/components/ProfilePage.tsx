import React, { useState, useEffect } from 'react';
import { X, Search, Heart, Save } from 'lucide-react';
import type { User, TeamSimple } from '../types/user';
import type { GameType } from '../types/match';
import { searchTeams, updateUserFavorites, fetchUserFavorites } from '../services/api';
import '../styles/ProfilePage.css';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser }) => {
  const [favorites, setFavorites] = useState<TeamSimple[]>(user.favoriteTeams || []);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Record<string, TeamSimple[]>>({});
  const [saving, setSaving] = useState(false);

  const games: GameType[] = ['Counter-Strike 2', 'Valorant', 'League of Legends'];

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favs = await fetchUserFavorites(user.id);
        setFavorites(favs);
      } catch (err) {
        console.error('Failed to load favorites', err);
      }
    };
    loadFavorites();
  }, [user.id]);

  const handleSearch = async (game: string, query: string) => {
    setSearchQueries(prev => ({ ...prev, [game]: query }));
    
    if (query.length < 2) {
      setSearchResults(prev => ({ ...prev, [game]: [] }));
      return;
    }

    try {
      const results = await searchTeams(query);
      // Filter results for the specific game if possible, though PandaScore search is broad
      setSearchResults(prev => ({ ...prev, [game]: results }));
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  const selectTeam = (game: string, team: TeamSimple) => {
    const newFavs = favorites.filter(f => f.game !== game);
    newFavs.push({ ...team, game });
    setFavorites(newFavs);
    setSearchQueries(prev => ({ ...prev, [game]: '' }));
    setSearchResults(prev => ({ ...prev, [game]: [] }));
  };

  const removeTeam = (game: string) => {
    setFavorites(favorites.filter(f => f.game !== game));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserFavorites(user.id, favorites);
      onUpdateUser({ ...user, favoriteTeams: favorites });
      alert('Favorites updated successfully!');
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save favorites.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>{user.username}</h1>
            <p>{user.email}</p>
          </div>
        </div>
      </div>

      <div className="favorites-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Heart className="heart-icon" style={{ color: 'var(--valorant-color)' }} fill="var(--valorant-color)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>FAVORITE TEAMS</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Choose one team for each game to highlight their matches.</p>

        <div className="favorites-grid">
          {games.map(game => {
            const favorite = favorites.find(f => f.game === game);
            
            return (
              <div key={game} className={`favorite-slot ${favorite ? 'active' : ''}`}>
                <div className="game-label-large">{game}</div>
                
                {favorite ? (
                  <div className="team-selection-area">
                    <div className="selected-team-info">
                      {favorite.logo ? (
                        <img src={favorite.logo} alt="" className="selected-team-logo" />
                      ) : (
                        <div className="selected-team-logo" style={{fontSize: '1.2rem'}}>🛡️</div>
                      )}
                      <span className="selected-team-name">{favorite.name}</span>
                    </div>
                    <button className="remove-btn" onClick={() => removeTeam(game)}>
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="search-teams-box">
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        placeholder="Search team..."
                        className="team-search-input"
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchQueries[game] || ''}
                        onChange={(e) => handleSearch(game, e.target.value)}
                      />
                    </div>
                    
                    {searchResults[game] && searchResults[game].length > 0 && (
                      <div className="search-results-dropdown">
                        {searchResults[game].map(team => (
                          <div key={team.id} className="search-result-item" onClick={() => selectTeam(game, team)}>
                            {team.logo ? (
                              <img src={team.logo} alt="" className="search-result-logo" />
                            ) : (
                              <div className="search-result-logo" style={{fontSize: '1rem'}}>🛡️</div>
                            )}
                            <span className="search-result-name">{team.name}</span>
                            <span className="search-result-game">{team.game}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="save-section">
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={saving}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
