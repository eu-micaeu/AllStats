import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import type { Match, GameType } from './types/match';
import type { User } from './types/user';
import { fetchMatches } from './services/api';
import { wsService } from './services/websocket';
import MatchCard from './components/MatchCard';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import GameFilter from './components/GameFilter';
import TournamentPage from './components/TournamentPage';
import TournamentDetail from './components/TournamentDetail';
import SeriesDetail from './components/SeriesDetail';
import './styles/theme.css';

function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameType | 'All'>('All');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for existing user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    const loadInitialData = async () => {
      try {
        const initialMatches = await fetchMatches();
        setMatches(initialMatches);
        setLoading(false);
      } catch {
        setError('Failed to connect to AllStats backend.');
        setLoading(false);
      }
    };

    loadInitialData();

    // Connect to WebSocket for live updates
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
  };

  const games: GameType[] = ['Counter-Strike 2', 'Valorant', 'Overwatch', 'League of Legends'];

  const getGameColor = (game: GameType) => {
    switch (game) {
      case 'Counter-Strike 2': return 'var(--cs2-color)';
      case 'Valorant': return 'var(--valorant-color)';
      case 'League of Legends': return 'var(--lol-color)';
      case 'Overwatch': return '#f99e1a';
      default: return 'var(--accent-color)';
    }
  };

  const renderGameSection = (game: GameType) => {
    const gameMatches = matches.filter(m => m.game === game);
    const displayMatches = selectedGame === 'All' ? gameMatches.slice(0, 6) : gameMatches;

    if (selectedGame !== 'All' && selectedGame !== game) return null;
    
    if (gameMatches.length === 0) {
      if (selectedGame === 'All') return null;
      return (
        <section key={game} style={{ marginBottom: '4rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1.5rem', 
            borderLeft: `4px solid ${getGameColor(game)}`, 
            paddingLeft: '1rem',
            textTransform: 'uppercase'
          }}>
            {game}
          </h2>
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
            No {game} matches found at the moment.
          </div>
        </section>
      );
    }

    return (
      <section key={game} style={{ marginBottom: '4rem' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1.5rem', 
          borderLeft: `4px solid ${getGameColor(game)}`, 
          paddingLeft: '1rem',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between'
        }}>
          <span>{game}</span>
        </h2>
        <div className="match-grid">
          {displayMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>
    );
  };

  const getCurrentPage = () => {
    if (location.pathname === '/') return 'matches';
    if (location.pathname.startsWith('/tournaments')) return 'tournaments';
    if (location.pathname.startsWith('/series')) return 'tournaments';
    return 'matches';
  };

  if (loading) return <div className="container">Loading matches...</div>;
  if (error) return <div className="container" style={{color: 'var(--valorant-color)'}}>{error}</div>;

  return (
    <div className="app-wrapper">
      <Header 
        user={user} 
        onAuthClick={() => setIsAuthOpen(true)} 
        onLogout={handleLogout}
        currentPage={getCurrentPage() as any}
        onPageSelect={(page) => navigate(page === 'matches' ? '/' : '/tournaments')}
      />
      
      <div className="container">
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <GameFilter selectedGame={selectedGame} onGameSelect={setSelectedGame} />
                {selectedGame === 'All' ? (
                  games.map(game => renderGameSection(game))
                ) : (
                  renderGameSection(selectedGame as GameType)
                )}
              </>
            } />
            
            <Route path="/tournaments" element={
              <TournamentPage onTournamentClick={(id) => navigate(`/tournaments/${id}`)} />
            } />
            
            <Route path="/tournaments/:id" element={
              <TournamentDetailWrapper onSeriesClick={(id, name) => navigate(`/series/${id}?name=${encodeURIComponent(name)}`)} />
            } />

            <Route path="/series/:id" element={
              <SeriesDetailWrapper />
            } />
          </Routes>
        </main>
      </div>

      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

// Wrapper components to handle URL params
import { useParams, useSearchParams } from 'react-router-dom';

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
