import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Swords, Layout, Search } from 'lucide-react';
import { 
  fetchSeriesTeams, 
  fetchSeriesMatches, 
  fetchSeriesInfo,
  fetchTournamentStandings,
  fetchTournamentBrackets
} from '../services/api';
import '../styles/SeriesDetail.css';

interface SeriesDetailProps {
  seriesId: string;
  seriesName: string;
  onBack: () => void;
}

const SeriesDetail: React.FC<SeriesDetailProps> = ({ seriesId, seriesName, onBack }) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'teams' | 'standings'>('standings');
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [seriesInfo, setSeriesInfo] = useState<any>(null);
  const [tournamentData, setTournamentData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [hoveredTeamId, setHoveredTeamId] = useState<number | null>(null);
  const [bracketSearchQuery, setBracketSearchQuery] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, matchesData, infoData] = await Promise.all([
          fetchSeriesTeams(seriesId),
          fetchSeriesMatches(seriesId),
          fetchSeriesInfo(seriesId)
        ]);
        console.log('SeriesDetail: infoData:', infoData);
        setTeams(teamsData);
        setMatches(matchesData);
        setSeriesInfo(infoData);
        
        // Load data for each tournament (stage)
        if (infoData.tournaments) {
          const dataMap: any = {};
          await Promise.all(infoData.tournaments.map(async (t: any) => {
            const nameLower = t.name.toLowerCase();
            const isElimination = nameLower.includes('playoff') || nameLower.includes('play-in');
            
            try {
              if (isElimination) {
                console.log('SeriesDetail: Fetching bracket for tournament:', t.id);
                const bracketData = await fetchTournamentBrackets(t.id);
                console.log('SeriesDetail: Bracket data for', t.id, bracketData);
                dataMap[t.id] = { type: 'bracket', data: bracketData };
              } else {
                console.log('SeriesDetail: Fetching standings for tournament:', t.id);
                const standingsData = await fetchTournamentStandings(t.id);
                console.log('SeriesDetail: Standings data for', t.id, standingsData);
                dataMap[t.id] = { type: 'standings', data: standingsData };
              }
            } catch (err) {
              console.error(`SeriesDetail: Error fetching data for tournament ${t.id}:`, err);
            }
          }));
          console.log('SeriesDetail: dataMap:', dataMap);
          setTournamentData(dataMap);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load series deep details', err);
        setLoading(false);
      }
    };
    loadData();
  }, [seriesId]);

  if (loading) return <div className="loading-detail">Loading deep dive details...</div>;

  const renderStandings = (data: any[]) => {
    if (!Array.isArray(data)) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          Standings data not available for this stage.
        </div>
      );
    }
    
    return (
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '0.75rem 1rem' }}>Rank</th>
              <th style={{ padding: '0.75rem 1rem' }}>Team</th>
              <th style={{ padding: '0.75rem 1rem' }}>W-L</th>
              <th style={{ padding: '0.75rem 1rem' }}>Games</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry: any, index: number) => (
              <tr key={entry.team?.id || index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>#{entry.rank || index + 1}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {entry.team?.image_url && <img src={entry.team.image_url} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />}
                    <span style={{ fontWeight: 700 }}>{entry.team?.name || 'Unknown Team'}</span>
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{entry.wins}-{entry.losses}</td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{entry.game_wins || 0}W - {entry.game_losses || 0}L</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBracket = (bracketMatches: any[]) => {
    if (!Array.isArray(bracketMatches)) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          Bracket data not available for this stage.
        </div>
      );
    }

    // Sort matches by scheduled_at to have a logical flow
    const sortedMatches = [...bracketMatches].sort((a: any, b: any) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

    // Categories
    const upperRoundsMap: any = {};
    const lowerRoundsMap: any = {};
    const grandFinalMatches: any[] = [];

    sortedMatches.forEach((m: any) => {
      const name = m.name.toLowerCase();
      const isLower = name.includes('lower') || name.includes('losers');
      const isGrandFinal = name.includes('grand final');
      
      if (isGrandFinal) {
        grandFinalMatches.push(m);
        return;
      }

      let roundName = '';
      if (name.includes('final') && isLower) roundName = 'LB Final';
      else if (name.includes('final')) roundName = 'UB Final';
      else if (name.includes('semifinal') || name.includes('semi-final')) {
        roundName = isLower ? 'LB Semifinals' : 'UB Semifinals';
      }
      else if (name.includes('quarterfinal') || name.includes('quarter-final')) {
        roundName = isLower ? 'LB Quarterfinals' : 'UB Quarterfinals';
      }
      else if (name.includes('round 1')) roundName = isLower ? 'LB Round 1' : 'Round 1';
      else if (name.includes('round 2')) roundName = isLower ? 'LB Round 2' : 'Round 2';
      else if (name.includes('round 3')) roundName = isLower ? 'LB Round 3' : 'Round 3';
      else if (name.includes('round 4')) roundName = isLower ? 'LB Round 4' : 'Round 4';
      else {
        roundName = m.name.split(':')[0] || 'Bracket';
      }

      const targetMap = isLower ? lowerRoundsMap : upperRoundsMap;
      if (!targetMap[roundName]) targetMap[roundName] = [];
      targetMap[roundName].push(m);
    });

    const upperOrder = ['Round 1', 'Round 2', 'UB Quarterfinals', 'UB Semifinals', 'UB Final'];
    const lowerOrder = ['LB Round 1', 'LB Round 2', 'LB Round 3', 'LB Round 4', 'LB Quarterfinals', 'LB Semifinals', 'LB Final'];

    const sortedUpperRounds = Object.keys(upperRoundsMap).sort((a, b) => {
      const idxA = upperOrder.indexOf(a);
      const idxB = upperOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    const sortedLowerRounds = Object.keys(lowerRoundsMap).sort((a, b) => {
      const idxA = lowerOrder.indexOf(a);
      const idxB = lowerOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    const getScore = (match: any, teamId: number | null) => {
      if (!teamId || !match.results) return 0;
      const result = match.results.find((r: any) => r.team_id === teamId);
      return result ? result.score : 0;
    };

    const renderTeamLogo = (t: any) => {
      if (t?.image_url) {
        return <img src={t.image_url} alt="" className="bracket-team-logo" />;
      }
      const firstLetter = t?.name ? t.name.charAt(0).toUpperCase() : '?';
      return (
        <div className="bracket-team-fallback">
          {firstLetter}
        </div>
      );
    };

    const renderMatch = (m: any) => {
      const teamA = m.opponents[0]?.opponent;
      const teamB = m.opponents[1]?.opponent;
      const scoreA = getScore(m, teamA?.id);
      const scoreB = getScore(m, teamB?.id);
      const isFinished = m.status === 'finished';
      const winnerId = m.winner_id;

      const isTeamAHovered = teamA && hoveredTeamId === teamA.id;
      const isTeamBHovered = teamB && hoveredTeamId === teamB.id;
      const hasHoveredTeam = isTeamAHovered || isTeamBHovered;

      const isSearchMatch = (t: any) => t && bracketSearchQuery && t.name?.toLowerCase().includes(bracketSearchQuery.toLowerCase());
      const isTeamASearched = isSearchMatch(teamA);
      const isTeamBSearched = isSearchMatch(teamB);
      const hasSearchedTeam = isTeamASearched || isTeamBSearched;

      const isWinnerA = isFinished && winnerId === teamA?.id;
      const isWinnerB = isFinished && winnerId === teamB?.id;
      const isLoserA = isFinished && teamB && winnerId === teamB?.id;
      const isLoserB = isFinished && teamA && winnerId === teamA?.id;

      const isLive = m.status === 'live' || m.status === 'running';

      let cardClasses = "bracket-match-card";
      if (isLive) cardClasses += " is-live-match";
      if (hoveredTeamId && hasHoveredTeam) cardClasses += " has-hovered-team";
      if (bracketSearchQuery && hasSearchedTeam) cardClasses += " has-searched-team";

      let teamAClasses = "bracket-match-team-row";
      if (isWinnerA) teamAClasses += " is-winner";
      if (isLoserA) teamAClasses += " is-loser";
      if (isTeamAHovered) teamAClasses += " is-hovered";
      if (isTeamASearched) teamAClasses += " is-searched";

      let teamBClasses = "bracket-match-team-row";
      if (isWinnerB) teamBClasses += " is-winner";
      if (isLoserB) teamBClasses += " is-loser";
      if (isTeamBHovered) teamBClasses += " is-hovered";
      if (isTeamBSearched) teamBClasses += " is-searched";

      const formattedDate = new Date(m.scheduled_at).toLocaleString([], {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      return (
        <div key={m.id} className={cardClasses}>
          {isLive && (
            <div className="bracket-live-badge">
              <div className="pulse-dot" />
              LIVE
            </div>
          )}

          {/* Team A Row */}
          <div 
            className={teamAClasses}
            onMouseEnter={() => teamA && setHoveredTeamId(teamA.id)}
            onMouseLeave={() => setHoveredTeamId(null)}
          >
            <div className="bracket-team-info">
              {renderTeamLogo(teamA)}
              <span className="bracket-team-name" title={teamA?.name || 'TBD'}>
                {teamA?.acronym || teamA?.name || 'TBD'}
              </span>
            </div>
            <span className="bracket-team-score">{scoreA}</span>
          </div>

          {/* Team B Row */}
          <div 
            className={teamBClasses}
            onMouseEnter={() => teamB && setHoveredTeamId(teamB.id)}
            onMouseLeave={() => setHoveredTeamId(null)}
          >
            <div className="bracket-team-info">
              {renderTeamLogo(teamB)}
              <span className="bracket-team-name" title={teamB?.name || 'TBD'}>
                {teamB?.acronym || teamB?.name || 'TBD'}
              </span>
            </div>
            <span className="bracket-team-score">{scoreB}</span>
          </div>

          {/* Footer with date */}
          <div className="bracket-match-details-footer">
            {isFinished ? 'Encerrada' : isLive ? 'Em andamento' : formattedDate}
          </div>
        </div>
      );
    };

    return (
      <div className="bracket-wrapper">
        <div className="bracket-controls">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Chaveamento Interativo</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              Passe o mouse sobre um time ou pesquise para destacar sua trajetória
            </span>
          </div>
          <div className="bracket-search-container">
            <Search size={16} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Pesquisar equipe..."
              value={bracketSearchQuery}
              onChange={(e) => setBracketSearchQuery(e.target.value)}
              className="bracket-search-input"
            />
          </div>
        </div>

        <div className="bracket-container">
          {/* Upper Bracket */}
          {sortedUpperRounds.length > 0 && (
            <div className="bracket-section">
              <div className="bracket-section-header">
                <span className="bracket-section-title">Chave Superior</span>
                <span className="bracket-section-line"></span>
              </div>
              <div className="bracket-rounds-scroll">
                {sortedUpperRounds.map((roundName) => (
                  <div key={roundName} className="bracket-round-column">
                    <div className="bracket-round-header">{roundName}</div>
                    <div className="bracket-round-matches">
                      {upperRoundsMap[roundName].map((m: any) => renderMatch(m))}
                    </div>
                  </div>
                ))}
                
                {/* Grand Final in same flow if exists */}
                {grandFinalMatches.length > 0 && (
                  <div key="grand-final" className="bracket-round-column">
                    <div className="bracket-round-header" style={{ color: 'var(--accent-color)', fontWeight: 900 }}>Grande Final</div>
                    <div className="bracket-round-matches">
                      {grandFinalMatches.map((m: any) => renderMatch(m))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lower Bracket */}
          {sortedLowerRounds.length > 0 && (
            <div className="bracket-section lower">
              <div className="bracket-section-header">
                <span className="bracket-section-title">Chave Inferior</span>
                <span className="bracket-section-line"></span>
              </div>
              <div className="bracket-rounds-scroll">
                {sortedLowerRounds.map((roundName) => (
                  <div key={roundName} className="bracket-round-column">
                    <div className="bracket-round-header">{roundName}</div>
                    <div className="bracket-round-matches">
                      {lowerRoundsMap[roundName].map((m: any) => renderMatch(m))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="series-detail">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={20} />
        Back to League
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>{seriesName}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Overview: Matches, Teams, Brackets & Standings</p>
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Swords size={18} /> Matches ({matches.length})
          </div>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} /> Teams ({teams.length})
          </div>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'standings' ? 'active' : ''}`}
          onClick={() => setActiveTab('standings')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layout size={18} /> Brackets & Table
          </div>
        </button>
      </div>

      {activeTab === 'matches' && (
        <div className="matches-list-detail">
          {matches.length > 0 ? (
            Object.entries(matches.reduce((acc: any, match: any) => {
              const stage = match.stage || 'General';
              if (!acc[stage]) acc[stage] = [];
              acc[stage].push(match);
              return acc;
            }, {})).map(([stage, stageMatches]: [string, any]) => (
              <div key={stage} style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--accent-color)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {stage}
                  <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }}></span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {stageMatches.map((m: any) => (
                    <div key={m.id} className="match-row" style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem', position: 'relative' }}>
                      <div style={{ width: '70px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 }}>{new Date(m.startTime).toLocaleDateString()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                        <div style={{ flex: 1, textAlign: 'right', fontWeight: 700 }}>{m.teamA.name}</div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 900, minWidth: '50px', textAlign: 'center' }}>
                          {m.status === 'live' ? (
                            <span style={{ fontSize: '0.75rem' }}>{m.teamA.score} - {m.teamB.score}</span>
                          ) : m.status === 'upcoming' ? 'VS' : `${m.teamA.score} - ${m.teamB.score}`}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', fontWeight: 700 }}>{m.teamB.name}</div>
                      </div>
                      <div style={{ width: '100px', textAlign: 'right', fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        {m.leagueName}
                      </div>
                      
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No matches found.</div>
          )}
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="teams-grid">
          {teams.map(team => (
            <div key={team.id} className="team-detail-card" style={{ padding: '1rem' }}>
              <div className="team-header-detail" style={{ marginBottom: '1rem' }}>
                {team.imageUrl ? <img src={team.imageUrl} alt="" className="team-logo-small" style={{ width: '32px', height: '32px' }} /> : <div style={{ fontSize: '1.2rem' }}>🛡️</div>}
                <div className="team-name-detail" style={{ fontSize: '1.1rem' }}>{team.name}</div>
              </div>
              <div className="player-list">
                {team.players?.map((p: any) => (
                  <div key={p.id} className="player-item" style={{ padding: '0.4rem' }}>
                    <div className="player-info-detail">
                      <span className="player-nickname" style={{ fontSize: '0.8rem' }}>{p.name}</span>
                    </div>
                    {p.role && <span className="player-role" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>{p.role}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'standings' && (
        <div className="standings-deep-view">
          {seriesInfo?.tournaments?.map((t: any) => {
            const data = tournamentData[t.id];
            if (!data) return null;

            return (
              <div key={t.id} style={{ marginBottom: '4rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2rem', color: 'white', textTransform: 'uppercase', borderLeft: '4px solid var(--accent-color)', paddingLeft: '1rem' }}>
                  {t.name}
                </h3>
                {data.type === 'bracket' ? renderBracket(data.data) : renderStandings(data.data)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SeriesDetail;
