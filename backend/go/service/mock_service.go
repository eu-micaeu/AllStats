package service

import (
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/micael/allstats/backend/models"
)

type MockService struct {
	matches []models.Match
	mu      sync.RWMutex
	updates chan models.Match
}

func NewMockService() *MockService {
	s := &MockService{
		updates: make(chan models.Match, 10),
		matches: []models.Match{
			// League of Legends
			{ID: "l1", Game: models.LoL, Status: "live", GameTime: "25:40", TeamA: models.Team{ID: "t1", Name: "T1", Score: 1}, TeamB: models.Team{ID: "t2", Name: "Gen.G", Score: 1}},
			{ID: "l2", Game: models.LoL, Status: "live", GameTime: "12:15", TeamA: models.Team{ID: "t7", Name: "G2 Esports", Score: 0}, TeamB: models.Team{ID: "t8", Name: "Fnatic", Score: 0}},
			{ID: "l3", Game: models.LoL, Status: "upcoming", StartTime: "20:00", TeamA: models.Team{ID: "t9", Name: "Cloud9", Score: 0}, TeamB: models.Team{ID: "t10", Name: "Team Liquid", Score: 0}},
			{ID: "l4", Game: models.LoL, Status: "finished", GameTime: "Final", TeamA: models.Team{ID: "t11", Name: "JDG", Score: 3}, TeamB: models.Team{ID: "t12", Name: "BLG", Score: 2}},
			{ID: "l5", Game: models.LoL, Status: "upcoming", StartTime: "22:00", TeamA: models.Team{ID: "t13", Name: "FlyQuest", Score: 0}, TeamB: models.Team{ID: "t14", Name: "100 Thieves", Score: 0}},
			{ID: "l6", Game: models.LoL, Status: "live", GameTime: "05:10", TeamA: models.Team{ID: "t15", Name: "Hanwha Life", Score: 0}, TeamB: models.Team{ID: "t16", Name: "DK", Score: 0}},

			// Counter-Strike 2
			{ID: "c1", Game: models.CS2, Status: "live", GameTime: "Round 21", TeamA: models.Team{ID: "t3", Name: "NAVI", Score: 11}, TeamB: models.Team{ID: "t4", Name: "FaZe Clan", Score: 9}},
			{ID: "c2", Game: models.CS2, Status: "live", GameTime: "Round 5", TeamA: models.Team{ID: "t17", Name: "Vitality", Score: 3}, TeamB: models.Team{ID: "t18", Name: "MOUZ", Score: 2}},
			{ID: "c3", Game: models.CS2, Status: "upcoming", StartTime: "19:00", TeamA: models.Team{ID: "t19", Name: "Astralis", Score: 0}, TeamB: models.Team{ID: "t20", Name: "Liquid", Score: 0}},
			{ID: "c4", Game: models.CS2, Status: "finished", GameTime: "13-7", TeamA: models.Team{ID: "t21", Name: "Spirit", Score: 13}, TeamB: models.Team{ID: "t22", Name: "Virtus.pro", Score: 7}},
			{ID: "c5", Game: models.CS2, Status: "upcoming", StartTime: "21:30", TeamA: models.Team{ID: "t23", Name: "Complexity", Score: 0}, TeamB: models.Team{ID: "t24", Name: "FURIA", Score: 0}},
			{ID: "c6", Game: models.CS2, Status: "live", GameTime: "Round 14", TeamA: models.Team{ID: "t25", Name: "G2", Score: 8}, TeamB: models.Team{ID: "t26", Name: "Heroic", Score: 6}},

			// Valorant
			{ID: "v1", Game: models.Valorant, Status: "live", GameTime: "Map 3", TeamA: models.Team{ID: "t5", Name: "Sentinels", Score: 13}, TeamB: models.Team{ID: "t6", Name: "LOUD", Score: 11}},
			{ID: "v2", Game: models.Valorant, Status: "live", GameTime: "Map 1", TeamA: models.Team{ID: "t27", Name: "Fnatic", Score: 5}, TeamB: models.Team{ID: "t28", Name: "Paper Rex", Score: 8}},
			{ID: "v3", Game: models.Valorant, Status: "upcoming", StartTime: "18:00", TeamA: models.Team{ID: "t29", Name: "NRG", Score: 0}, TeamB: models.Team{ID: "t30", Name: "Leviatán", Score: 0}},
			{ID: "v4", Game: models.Valorant, Status: "finished", GameTime: "2-0", TeamA: models.Team{ID: "t31", Name: "EDG", Score: 2}, TeamB: models.Team{ID: "t32", Name: "DRX", Score: 0}},
			{ID: "v5", Game: models.Valorant, Status: "upcoming", StartTime: "23:00", TeamA: models.Team{ID: "t33", Name: "KRÜ", Score: 0}, TeamB: models.Team{ID: "t34", Name: "MIBR", Score: 0}},
			{ID: "v6", Game: models.Valorant, Status: "live", GameTime: "Map 2", TeamA: models.Team{ID: "t35", Name: "Gen.G", Score: 10}, TeamB: models.Team{ID: "t36", Name: "T1", Score: 4}},
		},
	}

	go s.startSimulation()
	return s
}

func (s *MockService) GetMatches() []models.Match {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.matches
}

func (s *MockService) Updates() chan models.Match {
	return s.updates
}

func (s *MockService) startSimulation() {
	ticker := time.NewTicker(5 * time.Second)
	for range ticker.C {
		s.mu.Lock()
		idx := rand.Intn(len(s.matches))
		match := &s.matches[idx]

		if match.Status == "live" {
			// Randomly increment score for Team A or Team B
			if rand.Float32() > 0.5 {
				match.TeamA.Score++
			} else {
				match.TeamB.Score++
			}
			
			// Update game time simulation (very simple)
			if match.Game == models.LoL {
				match.GameTime = fmt.Sprintf("%d:00", 25 + rand.Intn(10))
			}

			// Send update to channel
			s.updates <- *match
		}
		s.mu.Unlock()
	}
}
