import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Star, Trophy, ArrowRight } from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="landing-hero animate-fade-in">
        <div className="landing-badge">
          <Sparkles size={14} />
          Welcome to AllStats
        </div>
        <h1 className="landing-title">
          The Ultimate Real-Time <br />
          <span>eSports Dashboard</span>
        </h1>
        <p className="landing-subtitle">
          Track matches, analyze tournaments, and follow your favorite teams in real-time across Counter-Strike 2, Valorant, and League of Legends. Powered by high-speed analytics.
        </p>
      </section>

      {/* Featured Games Section */}
      <h2 className="landing-games-title animate-fade-in delay-1">Supported Titles</h2>
      <section className="games-grid animate-fade-in delay-1">
        {/* CS2 */}
        <div className="game-card cs2">
          <div className="card-logo-wrapper">
            <img src="/logocs2.png" alt="Counter-Strike 2" className="card-logo" />
          </div>
          <h3 className="card-game-title" style={{ color: 'var(--cs2-color)' }}>CS2</h3>
          <p className="card-game-desc">
            Stay updated with round-by-round statistics, active matches, and live tournaments for Counter-Strike 2.
          </p>
        </div>

        {/* Valorant */}
        <div className="game-card valorant">
          <div className="card-logo-wrapper">
            <img src="/logoval.png" alt="Valorant" className="card-logo" style={{ transform: 'scale(1.1)' }} />
          </div>
          <h3 className="card-game-title" style={{ color: 'var(--valorant-color)' }}>VALORANT</h3>
          <p className="card-game-desc">
            Track tactical live matches, agent compositions, and VCT tournaments in real-time.
          </p>
        </div>

        {/* League of Legends */}
        <div className="game-card lol">
          <div className="card-logo-wrapper">
            <img src="/logolol.png" alt="League of Legends" className="card-logo" style={{ transform: 'scale(1.25)' }} />
          </div>
          <h3 className="card-game-title" style={{ color: 'var(--lol-color)' }}>LoL</h3>
          <p className="card-game-desc">
            Get instant match details, active regional leagues, and tournament brackets for League of Legends.
          </p>
        </div>
      </section>

      {/* Core Features Showcase */}
      <section className="features-section animate-fade-in delay-2">
        <div className="features-header">
          <h2>Core Features</h2>
          <p>Designed for competitive players and statistics enthusiasts alike.</p>
        </div>
        <div className="features-grid">
          {/* Live Websocket Updates */}
          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Zap size={22} />
            </div>
            <h3 className="feature-title">Live WebSocket Updates</h3>
            <p className="feature-desc">
              Experience zero-latency live score and match status updates powered by WebSocket connections directly from our Go engine.
            </p>
          </div>

          {/* Tournament Tracking */}
          <div className="feature-box pink">
            <div className="feature-icon-wrapper">
              <Trophy size={22} />
            </div>
            <h3 className="feature-title">Live Tournaments</h3>
            <p className="feature-desc">
              Track the biggest events globally. Explore current standings, match schedules, and tournament details in a structured dashboard.
            </p>
          </div>

          {/* Favorites System */}
          <div className="feature-box green">
            <div className="feature-icon-wrapper">
              <Star size={22} />
            </div>
            <h3 className="feature-title">Personalized Favorites</h3>
            <p className="feature-desc">
              Create an account to pin tournaments to your dashboard and track matches that matter most to you.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
