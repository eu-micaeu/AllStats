import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Swords, Trophy, ChevronRight } from 'lucide-react';
import type { Match, GameType } from './types/match';
import type { User } from './types/user';
import { fetchMatches, fetchTournaments } from './services/api';
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
    let uid = '';
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        uid = parsed.id || (parsed as any)._id || '';
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

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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

        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Trophy size={18} color={getGameColor(game)} /> 
            TOURNAMENTS
            <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)', marginLeft: '1rem' }}></span>
          </h2>
          {tournaments.filter(t => t.game === game).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {[...tournaments.filter(t => t.game === game)]
                .sort((a, b) => {
                  if (a.status === 'live' && b.status !== 'live') return -1;
                  if (a.status !== 'live' && b.status === 'live') return 1;
                  return 0;
                })
                .slice(0, 5)
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
    if (location.pathname === '/') return 'matches';
    if (location.pathname === '/profile') return 'profile';
    if (location.pathname.startsWith('/tournaments')) return 'tournaments';
    if (location.pathname.startsWith('/series')) return 'tournaments';
    return 'matches';
  };

  if (loading) return <div className="container">Loading dashboard...</div>;
  if (error) return <div className="container" style={{color: 'var(--valorant-color)'}}>{error}</div>;

  return (
    <div className="app-wrapper">
      <Header user={user} onAuthClick={() => setIsAuthOpen(true)} onLogout={handleLogout} currentPage={getCurrentPage() as any} onPageSelect={(page) => navigate(page === 'matches' ? '/' : page === 'profile' ? '/profile' : '/tournaments')} />
      <div className="container">
        <main>
          <Routes>
            <Route path="/" element={<><GameFilter selectedGame={selectedGame} onGameSelect={setSelectedGame} />{renderGameSection(selectedGame)}</>} />
            <Route path="/tournaments" element={<TournamentPage onTournamentClick={(id) => navigate(`/tournaments/${id}`)} />} />
            <Route path="/tournaments/:id" element={<TournamentDetailWrapper onSeriesClick={(id, name) => navigate(`/series/${id}?name=${encodeURIComponent(name)}`)} />} />
            <Route path="/series/:id" element={<SeriesDetailWrapper />} />
            <Route path="/profile" element={user ? <ProfilePage user={user} onUpdateUser={handleUpdateUser} /> : <div className="container">Please sign in to view your profile.</div>} />
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
