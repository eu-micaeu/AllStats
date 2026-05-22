import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Swords, Trophy, ChevronRight, Star } from 'lucide-react';
import type { Match, GameType } from './types/match';
import type { User } from './types/user';
import { fetchMatches, fetchTournaments, addFavoriteTournament, removeFavoriteTournament } from './services/api';
import { wsService } from './services/websocket';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import GameFilter from './components/GameFilter';
import MatchCard from './components/MatchCard';
import TournamentPage from './components/TournamentPage';
import TournamentDetail from './components/TournamentDetail';
import SeriesDetail from './components/SeriesDetail';
import ProfilePage from './components/ProfilePage';
import LandingPage from './components/LandingPage';
import './styles/theme.css';

function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameType>('Counter-Strike 2');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const normalizedUser = {
          ...parsed,
          id: parsed.id || parsed._id || '',
          favoriteTournaments: parsed.favoriteTournaments || []
        };
        setUser(normalizedUser);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    const loadInitialData = async () => {
      try {
        const [initialMatches, initialTournaments] = await Promise.all([
          fetchMatches(),
          fetchTournaments()
        ]);
        setMatches(initialMatches);
        setTournaments(initialTournaments);
        setLoading(false);
      } catch (err) {
        console.error('App: Initialization error:', err);
        setError('Failed to connect to AllStats backend.');
        setLoading(false);
      }
    };

    loadInitialData();

    wsService.connect((updatedMatch) => {
      setMatches((prevMatches) => 
        prevMatches.map((m) => m.id === updatedMatch.id ? updatedMatch : m)
      );
    });

    return () => {
      wsService.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const handleUpdateUser = (updatedUser: User) => {
    console.log('App: Updating user state and localStorage:', updatedUser);
    setUser(prevUser => {
      const merged = prevUser ? { ...prevUser, ...updatedUser } : updatedUser;
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const handleToggleFavorite = async (e: React.MouseEvent, tournamentId: string) => {
    e.stopPropagation();
    if (!user || !user.id) {
      console.warn('App: Toggle favorite failed - no user logged in');
      return;
    }

    const tId = String(tournamentId);
    const currentFavorites = user.favoriteTournaments || [];
    const isFavorited = currentFavorites.map(String).includes(tId);
    
    console.log(`App: Toggling favorite for ${tId}. Currently favorited: ${isFavorited}`);

    // 1. Prepare updated user
    const updatedFavorites = isFavorited
      ? currentFavorites.filter(id => String(id) !== tId)
      : [...currentFavorites, tId];
    
    const updatedUser = { ...user, favoriteTournaments: updatedFavorites };

    // 2. Immediate UI Update
    handleUpdateUser(updatedUser);

    try {
      if (isFavorited) {
        await removeFavoriteTournament(user.id, tId);
        console.log(`App: Removed ${tId} from server`);
      } else {
        await addFavoriteTournament(user.id, tId);
        console.log(`App: Added ${tId} to server`);
      }
    } catch (err) {
      console.error('App: Failed to toggle favorite on server:', err);
      // Rollback
      handleUpdateUser(user);
    }
  };

  const getGameColor = (game: GameType) => {
    switch (game) {
      case 'Counter-Strike 2': return 'var(--cs2-color)';
      case 'Valorant': return 'var(--valorant-color)';
      case 'League of Legends': return 'var(--lol-color)';
      default: return 'var(--accent-color)';
    }
  };

  const renderGameSection = (game: GameType) => {
    const gameMatches = matches.filter(m => m.game === game);
    
    const activeMatches = gameMatches.filter(m => m.status === 'live' || m.status === 'upcoming');
    const sortedActive = [...activeMatches].sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (a.status !== 'live' && b.status === 'live') return 1;
      return new Date(a.startTime || '').getTime() - new Date(b.startTime || '').getTime();
    });

    const finishedMatches = gameMatches.filter(m => m.status === 'finished');
    const sortedFinished = [...finishedMatches].sort((a, b) => 
      new Date(b.startTime || '').getTime() - new Date(a.startTime || '').getTime()
    );

    const displayMatches = sortedActive.slice(0, 5);
    const displayResults = sortedFinished.slice(0, 5);

    if (selectedGame !== game) return null;
    
    return (
      <div key={game} className="game-view-container">
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Swords size={18} color={getGameColor(game)} /> 
            MATCHES
            <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)', marginLeft: '1rem' }}></span>
          </h2>
          {displayMatches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {displayMatches.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No active matches found.</div>
          )}
        </section>
        {/* Section: Resultados */}
        {displayResults.length > 0 && (
          <section style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '1.1rem' }}>🏁</div>
              LATEST RESULTS
              <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)', marginLeft: '1rem' }}></span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {displayResults.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </section>
        )}

        {/* Section: Torneios */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Trophy size={18} color={getGameColor(game)} /> 
            LIVE TOURNAMENTS
            <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)', marginLeft: '1rem' }}></span>
          </h2>
          {tournaments.filter(t => t.game === game && (t.status === 'live' || t.status === 'upcoming')).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {[...tournaments.filter(t => t.game === game && (t.status === 'live' || t.status === 'upcoming'))]
                .sort((a, b) => {
                  if (a.status === 'live' && b.status !== 'live') return -1;
                  if (a.status !== 'live' && b.status === 'live') return 1;
                  return 0;
                })
                .map(league => (
                  <div key={league.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: league.status === 'live' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.01)',
                    border: league.status === 'live' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }} onClick={() => navigate(`/tournaments/${league.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      {user && (
                        <button 
                          onClick={(e) => handleToggleFavorite(e, league.id)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            padding: '0.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: user.favoriteTournaments?.includes(league.id) ? '#fbbf24' : 'var(--text-secondary)'
                          }}
                        >
                          <Star size={14} fill={user.favoriteTournaments?.includes(league.id) ? '#fbbf24' : 'none'} />
                        </button>
                      )}
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{league.name}</span>
                      {league.status === 'live' && (
                        <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--live-color)', background: 'rgba(34, 197, 94, 0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>LIVE</span>
                      )}
                    </div>
                    <ChevronRight size={14} color="var(--text-secondary)" />
                  </div>
                ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No active tournaments found.</div>
          )}
        </section>
      </div>
    );
  };

  const getCurrentPage = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname === '/matches') return 'matches';
    if (location.pathname === '/profile') return 'profile';
    if (location.pathname.startsWith('/tournaments')) return 'tournaments';
    if (location.pathname.startsWith('/series')) return 'tournaments';
    return 'home';
  };

  if (loading) return <div className="container">Loading dashboard...</div>;
  if (error) return <div className="container" style={{color: 'var(--valorant-color)'}}>{error}</div>;

  return (
    <div className="app-wrapper">
      <Header user={user} onAuthClick={() => setIsAuthOpen(true)} onLogout={handleLogout} currentPage={getCurrentPage() as any} onPageSelect={(page) => navigate(page === 'home' ? '/' : page === 'matches' ? '/matches' : page === 'profile' ? '/profile' : '/tournaments')} />
      <div className="container">
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/matches" element={
              <>
                <GameFilter selectedGame={selectedGame} onGameSelect={setSelectedGame} />
                
                {renderGameSection(selectedGame)}

                {/* Favorites specifically for the Home page, below the Game section */}
                {user && user.favoriteTournaments && user.favoriteTournaments.length > 0 && (
                  <section style={{ marginBottom: '4rem', marginTop: '1rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: '#fbbf24', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Star size={18} fill="#fbbf24" color="#fbbf24" /> 
                      FAVORITE TOURNAMENTS
                      <span style={{ height: '1px', flex: 1, background: 'rgba(251, 191, 36, 0.1)', marginLeft: '1rem' }}></span>
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {tournaments
                        .filter(t => user.favoriteTournaments?.map(String).includes(String(t.id)))
                        .sort((a) => (a.status === 'live' ? -1 : 1))
                        .map(league => (
                          <div key={league.id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: 'rgba(251, 191, 36, 0.03)',
                            border: '1px solid rgba(251, 191, 36, 0.1)',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }} onClick={() => navigate(`/tournaments/${league.id}`)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                              <button 
                                onClick={(e) => handleToggleFavorite(e, String(league.id))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#fbbf24' }}
                              >
                                <Star size={14} fill="#fbbf24" />
                              </button>
                              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{league.name}</span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{league.game}</span>
                              </div>
                              {league.status === 'live' && (
                                <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--live-color)', background: 'rgba(34, 197, 94, 0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>LIVE</span>
                              )}
                            </div>
                            <ChevronRight size={14} color="var(--text-secondary)" />
                          </div>
                        ))}
                    </div>
                  </section>
                )}
              </>
            } />
            <Route path="/tournaments" element={<TournamentPage user={user} onToggleFavorite={handleToggleFavorite} onTournamentClick={(id) => navigate(`/tournaments/${id}`)} />} />
            <Route path="/tournaments/:id" element={<TournamentDetailWrapper onSeriesClick={(id, name) => navigate(`/series/${id}?name=${encodeURIComponent(name)}`)} />} />
            <Route path="/series/:id" element={<SeriesDetailWrapper />} />
            <Route path="/profile" element={user ? <ProfilePage user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} /> : <div className="container">Please sign in to view your profile.</div>} />
          </Routes>
        </main>
      </div>
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

const TournamentDetailWrapper: React.FC<{ onSeriesClick: (id: string, name: string) => void }> = ({ onSeriesClick }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  return <TournamentDetail tournamentId={id!} onBack={() => navigate('/tournaments')} onSeriesClick={onSeriesClick} />;
};

const SeriesDetailWrapper: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const name = searchParams.get('name') || 'Series Details';
  return <SeriesDetail seriesId={id!} seriesName={name} onBack={() => navigate(-1)} />;
};

export default App;
