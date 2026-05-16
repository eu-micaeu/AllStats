import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Swords, Newspaper, Trophy, ChevronRight } from 'lucide-react';
import type { Match, GameType } from './types/match';
import type { User } from './types/user';
import { fetchMatches, fetchFavoriteMatches, fetchTournaments } from './services/api';
import { wsService } from './services/websocket';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import GameFilter from './components/GameFilter';
import TournamentPage from './components/TournamentPage';
import TournamentDetail from './components/TournamentDetail';
import SeriesDetail from './components/SeriesDetail';
import ProfilePage from './components/ProfilePage';
import './styles/theme.css';

function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [favoriteMatches, setFavoriteMatches] = useState<Match[]>([]);
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
        console.log('App: Stored user found:', parsed);
        setUser(parsed);
        uid = parsed.id || (parsed as any)._id || '';
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    const loadInitialData = async () => {
      console.log('App: Loading data for UID:', uid);
      try {
        const [initialMatches, favMatches, initialTournaments] = await Promise.all([
          fetchMatches(),
          uid ? fetchFavoriteMatches(uid) : Promise.resolve([]),
          fetchTournaments()
        ]);
        console.log('App: Data fetched successfully');
        setMatches(initialMatches);
        setFavoriteMatches(favMatches);
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
      setFavoriteMatches((prevFavs) =>
        prevFavs.map((m) => m.id === updatedMatch.id ? updatedMatch : m)
      );
    });

    return () => {
      wsService.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setFavoriteMatches([]);
    navigate('/');
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    const uid = updatedUser.id || (updatedUser as any)._id;
    if (uid) {
      try {
        const favMatches = await fetchFavoriteMatches(uid);
        setFavoriteMatches(favMatches);
      } catch (err) {
        console.error('App: Refresh favorites error:', err);
      }
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

  const renderMatchRow = (m: Match) => (
    <div key={m.id} className="match-row" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0.6rem 1rem', 
      background: 'rgba(255,255,255,0.01)', 
      borderRadius: '6px', 
      border: '1px solid rgba(255,255,255,0.02)', 
      fontSize: '0.85rem' 
    }}>
      <div style={{ width: '100px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 }}>
        {m.startTime ? new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (m.status === 'live' ? 'LIVE' : '--:--')}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'center' }}>
        <div style={{ flex: 1, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {m.teamA.name}
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.04)', 
          padding: '0.2rem 0.6rem', 
          borderRadius: '4px', 
          fontWeight: 900, 
          minWidth: '55px', 
          textAlign: 'center',
          color: m.status === 'live' ? 'var(--live-color)' : 'inherit'
        }}>
          {m.status === 'live' ? (
            <span style={{ fontSize: '0.75rem' }}>{m.teamA.score} - {m.teamB.score}</span>
          ) : m.status === 'upcoming' ? 'VS' : `${m.teamA.score} - ${m.teamB.score}`}
        </div>
        <div style={{ flex: 1, textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {m.teamB.name}
        </div>
      </div>

      <div style={{ width: '100px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
        {m.stage || ''}
      </div>

      {/* Hover Tooltip */}
      <div className="match-tooltip">
        <div className="tooltip-header">{m.game} • {m.stage || 'Official Match'}</div>
        <div className="tooltip-content">
          <div className="tooltip-teams">
            <div className="tooltip-team">
              {m.teamA.logo ? <img src={m.teamA.logo} alt="" className="tooltip-logo" /> : <div className="tooltip-logo" style={{fontSize: '1.5rem'}}>🛡️</div>}
              <span className="tooltip-team-name">{m.teamA.name}</span>
            </div>
            <div className="tooltip-score-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em', lineHeight: 1 }}>
                {m.teamA.score} - {m.teamB.score}
              </div>
              {m.numberOfGames > 0 && (
                <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, marginTop: '0.2rem' }}>
                  Best of {m.numberOfGames}
                </div>
              )}
            </div>

            <div className="tooltip-team">
              {m.teamB.logo ? <img src={m.teamB.logo} alt="" className="tooltip-logo" /> : <div className="tooltip-logo" style={{fontSize: '1.5rem'}}>🛡️</div>}
              <span className="tooltip-team-name">{m.teamB.name}</span>
            </div>
          </div>
          <div className="tooltip-footer">
            <span style={{ color: m.status === 'live' ? 'var(--live-color)' : 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>
              {m.status === 'live' ? (
                <>Ongoing Match • Map {m.currentGame || '?'}</>
              ) : m.status === 'upcoming' ? (
                `Starts at ${new Date(m.startTime || '').toLocaleString()}`
              ) : (
                'Match Finished'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFavoriteMatches = () => {
    if (!user || favoriteMatches.length === 0) return null;

    const sortedFavs = [...favoriteMatches].sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (a.status !== 'live' && b.status === 'live') return 1;
      return new Date(a.startTime || '').getTime() - new Date(b.startTime || '').getTime();
    });

    return (
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ 
          fontSize: '1rem', 
          fontWeight: 800, 
          marginBottom: '1.5rem', 
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={18} fill="var(--valorant-color)" color="var(--valorant-color)" />
            <span>MY FAVORITES</span>
          </div>
          <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)', marginLeft: '1rem' }}></span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {sortedFavs.map(m => renderMatchRow(m))}
        </div>
      </section>
    );
  };

  const renderGameSection = (game: GameType) => {
    const gameMatches = matches.filter(m => m.game === game);
    const gameLeagues = tournaments.filter(t => t.game === game).slice(0, 5);
    
    // Sort to prioritize LIVE matches
    const sortedMatches = [...gameMatches].sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (a.status !== 'live' && b.status === 'live') return 1;
      return 0;
    });

    const displayMatches = sortedMatches.slice(0, 5);
    if (selectedGame !== game) return null;
    
    return (
      <div key={game} className="game-view-container">
        {/* Section: Partidas */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Swords size={18} color={getGameColor(game)} /> 
            PARTIDAS
            <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)', marginLeft: '1rem' }}></span>
          </h2>
          {gameMatches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {displayMatches.map((m) => renderMatchRow(m))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No matches found.</div>
          )}
        </section>

        {/* Section: Noticias */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Newspaper size={18} color={getGameColor(game)} /> 
            NOTÍCIAS
            <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)', marginLeft: '1rem' }}></span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--accent-color)', marginBottom: '0.5rem' }}>BREAKING</div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>New patch updates balance the current {game} meta.</p>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>2 hours ago</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--valorant-color)', marginBottom: '0.5rem' }}>TRANSFER</div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Major roster changes announced ahead of next season.</p>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>5 hours ago</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--live-color)', marginBottom: '0.5rem' }}>TOURNAMENT</div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Prize pool increased for upcoming world championship.</p>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>1 day ago</div>
            </div>
          </div>
        </section>

        {/* Section: Torneios */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Trophy size={18} color={getGameColor(game)} /> 
            TORNEIOS
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
            <Route path="/" element={<>{renderFavoriteMatches()}<GameFilter selectedGame={selectedGame} onGameSelect={setSelectedGame} />{renderGameSection(selectedGame)}</>} />
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
