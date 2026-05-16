import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Swords, Trophy, Layout } from 'lucide-react';
import { 
  fetchSeriesTeams, 
  fetchSeriesMatches, 
  fetchSeriesInfo,
  fetchTournamentStandings,
  fetchTournamentBrackets
} from '../services/api';
import MatchCard from './MatchCard';
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, matchesData, infoData] = await Promise.all([
          fetchSeriesTeams(seriesId),
          fetchSeriesMatches(seriesId),
          fetchSeriesInfo(seriesId)
        ]);
        setTeams(teamsData);
        setMatches(matchesData);
        setSeriesInfo(infoData);
        
        // Load data for each tournament (stage)
        if (infoData.tournaments) {
          const dataMap: any = {};
          await Promise.all(infoData.tournaments.map(async (t: any) => {
            const isPlayoffs = t.name.toLowerCase().includes('playoff');
            if (isPlayoffs) {
              dataMap[t.id] = { type: 'bracket', data: await fetchTournamentBrackets(t.id) };
            } else {
              dataMap[t.id] = { type: 'standings', data: await fetchTournamentStandings(t.id) };
            }
          }));
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

  const renderStandings = (data: any[]) => (
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

  const renderBracket = (bracketMatches: any[]) => {
    // Sort matches by scheduled_at to have a logical flow
    const sortedMatches = [...bracketMatches].sort((a: any, b: any) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

    // Group matches by round name
    const roundsMap = sortedMatches.reduce((acc: any, m: any) => {
      // Use the match name to determine the round, e.g., "Grand Final", "Quarterfinals"
      let roundName = 'Other';
      const name = m.name.toLowerCase();
      if (name.includes('grand final')) roundName = 'Final';
      else if (name.includes('semifinal') || name.includes('semi-final')) roundName = 'Semifinals';
      else if (name.includes('quarterfinal') || name.includes('quarter-final')) roundName = 'Quarterfinals';
      else if (name.includes('lower bracket final')) roundName = 'LB Final';
      else if (name.includes('upper bracket final')) roundName = 'UB Final';
      else if (name.includes('round 1')) roundName = 'Round 1';
      else if (name.includes('round 2')) roundName = 'Round 2';
      else if (name.includes('round 3')) roundName = 'Round 3';
      else {
        // Fallback: extract the first part before the colon
        roundName = m.name.split(':')[0] || 'Bracket';
      }

      if (!acc[roundName]) acc[roundName] = [];
      acc[roundName].push(m);
      return acc;
    }, {});

    // Logical order for round columns
    const roundOrder = ['Round 1', 'Round 2', 'Quarterfinals', 'UB Final', 'LB Final', 'Semifinals', 'Final'];
    const sortedRounds = Object.keys(roundsMap).sort((a, b) => {
      const idxA = roundOrder.indexOf(a);
      const idxB = roundOrder.indexOf(b);
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

    return (
      <div className="bracket-container" style={{ paddingBottom: '2rem', width: '100%' }}>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', width: '100%' }}>
          {sortedRounds.map((roundName) => (
            <div key={roundName} style={{ flex: 1, minWidth: '0' }}>
              <h4 style={{ 
                fontSize: '0.6rem', 
                textTransform: 'uppercase', 
                color: 'var(--text-secondary)', 
                marginBottom: '1rem', 
                textAlign: 'center', 
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}>
                {roundName}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-around', height: 'calc(100% - 2rem)' }}>
                {roundsMap[roundName].map((m: any) => {
                  const teamA = m.opponents[0]?.opponent;
                  const teamB = m.opponents[1]?.opponent;
                  const scoreA = getScore(m, teamA?.id);
                  const scoreB = getScore(m, teamB?.id);
                  const isFinished = m.status === 'finished';
                  const winnerId = m.winner_id;

                  const getDisplayName = (t: any) => t?.acronym || (t?.name ? (t.name.length > 8 ? t.name.substring(0, 5) + '..' : t.name) : 'TBD');

                  return (
                    <div key={m.id} style={{ 
                      background: 'var(--card-bg)', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.4rem 0.5rem',
                        background: winnerId === teamA?.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        opacity: isFinished && winnerId !== teamA?.id ? 0.4 : 1,
                        borderBottom: '1px solid rgba(255,255,255,0.02)'
                      }}>
                        <span style={{ fontWeight: 800, fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getDisplayName(teamA)}
                        </span>
                        <span style={{ fontWeight: 900, fontSize: '0.75rem', color: winnerId === teamA?.id ? 'var(--accent-color)' : 'white' }}>{scoreA}</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.4rem 0.5rem',
                        background: winnerId === teamB?.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        opacity: isFinished && winnerId !== teamB?.id ? 0.4 : 1
                      }}>
                        <span style={{ fontWeight: 800, fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getDisplayName(teamB)}
                        </span>
                        <span style={{ fontWeight: 900, fontSize: '0.75rem', color: winnerId === teamB?.id ? 'var(--accent-color)' : 'white' }}>{scoreB}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }}>
                      <div style={{ width: '70px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 }}>{new Date(m.startTime).toLocaleDateString()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                        <div style={{ flex: 1, textAlign: 'right', fontWeight: 700 }}>{m.teamA.name}</div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 900, minWidth: '50px', textAlign: 'center' }}>
                          {m.status === 'live' ? 'LIVE' : m.status === 'upcoming' ? 'VS' : `${m.teamA.score} - ${m.teamB.score}`}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', fontWeight: 700 }}>{m.teamB.name}</div>
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
