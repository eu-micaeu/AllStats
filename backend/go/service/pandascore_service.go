package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/micael/allstats/backend/models"
)

type PandaScoreService struct {
	token       string
	matches     []models.Match
	tournaments []models.Tournament
	updates     chan models.Match
}

func NewPandaScoreService(token string) *PandaScoreService {
	s := &PandaScoreService{
		token:       token,
		updates:     make(chan models.Match, 10),
		matches:     []models.Match{},
		tournaments: []models.Tournament{},
	}
	// Initial fetch
	s.fetchFromPandaScore()
	s.fetchTournaments()
	go s.pollData()
	return s
}

func (s *PandaScoreService) GetMatches() []models.Match {
	return s.matches
}

func (s *PandaScoreService) GetTournaments() []models.Tournament {
	return s.tournaments
}

func (s *PandaScoreService) Updates() chan models.Match {
	return s.updates
}

func (s *PandaScoreService) pollData() {
	ticker := time.NewTicker(60 * time.Second) // Poll every 60 seconds
	for {
		<-ticker.C
		s.fetchFromPandaScore()
		s.fetchTournaments()
	}
}

func (s *PandaScoreService) fetchTournaments() {
	newTournaments := []models.Tournament{}
	client := &http.Client{}

	for page := 1; page <= 10; page++ {
		url := fmt.Sprintf("https://api.pandascore.co/leagues?filter[videogame_id]=1,3,26,14&sort=name&page=%d&per_page=100", page)
		
		req, _ := http.NewRequest("GET", url, nil)
		req.Header.Set("Authorization", "Bearer "+s.token)
		req.Header.Set("Accept", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error fetching leagues page %d: %v\n", page, err)
			break
		}

		if resp.StatusCode != http.StatusOK {
			fmt.Printf("Error fetching leagues page %d: Status %d\n", page, resp.StatusCode)
			resp.Body.Close()
			break
		}

		var batch []struct {
			ID        int    `json:"id"`
			Name      string `json:"name"`
			ImageURL  string `json:"image_url"`
			Videogame struct {
				Slug string `json:"slug"`
			} `json:"videogame"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&batch); err != nil {
			fmt.Printf("Error decoding leagues page %d: %v\n", page, err)
			resp.Body.Close()
			break
		}
		resp.Body.Close()

		if len(batch) == 0 {
			break
		}

		for _, pl := range batch {
			var displayGame models.GameType
			switch pl.Videogame.Slug {
			case "csgo", "cs-go", "cs-2", "cs2":
				displayGame = models.CS2
			case "valorant":
				displayGame = models.Valorant
			case "league-of-legends":
				displayGame = models.LoL
			case "overwatch", "ow", "overwatch-2":
				displayGame = models.Overwatch
			default:
				continue
			}

			newTournaments = append(newTournaments, models.Tournament{
				ID:       fmt.Sprintf("%d", pl.ID),
				Name:     pl.Name,
				Game:     displayGame,
				Status:   "running",
				League:   pl.Name,
				ImageURL: pl.ImageURL,
			})
		}
	}
	s.tournaments = newTournaments
}

func (s *PandaScoreService) fetchFromPandaScore() {
	games := []string{"league-of-legends", "csgo", "valorant", "overwatch"}
	newMatches := []models.Match{}

	client := &http.Client{}

	for _, gameSlug := range games {
		url := fmt.Sprintf("https://api.pandascore.co/matches?filter[videogame]=%s&filter[status]=running,not_started&sort=begin_at&page=1&per_page=30", gameSlug)
		req, _ := http.NewRequest("GET", url, nil)
		req.Header.Set("Authorization", "Bearer "+s.token)
		req.Header.Set("Accept", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error fetching matches for %s: %v\n", gameSlug, err)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			continue
		}

		var batch []struct {
			ID       int    `json:"id"`
			Status   string `json:"status"`
			BeginAt  string `json:"begin_at"`
			Videogame struct {
				Slug string `json:"slug"`
			} `json:"videogame"`
			Opponents []struct {
				Opponent struct {
					ID       int    `json:"id"`
					Name     string `json:"name"`
					ImageURL string `json:"image_url"`
				} `json:"opponent"`
			} `json:"opponents"`
			Results []struct {
				Score      int `json:"score"`
				TeamID int `json:"team_id"`
			} `json:"results"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&batch); err != nil {
			resp.Body.Close()
			continue
		}
		resp.Body.Close()

		for _, pm := range batch {
			slug := pm.Videogame.Slug
			
			var displayGame models.GameType
			switch slug {
			case "cs-go", "csgo":
				displayGame = models.CS2
			case "valorant":
				displayGame = models.Valorant
			case "league-of-legends":
				displayGame = models.LoL
			case "ow", "overwatch", "overwatch-2":
				displayGame = models.Overwatch
			default:
				continue
			}

			status := pm.Status
			if status == "running" {
				status = "live"
			} else if status == "not_started" {
				status = "upcoming"
			}

			match := models.Match{
				ID:        fmt.Sprintf("%d", pm.ID),
				Status:    status,
				Game:      displayGame,
				StartTime: pm.BeginAt,
			}

			if len(pm.Opponents) >= 1 {
				match.TeamA = models.Team{
					ID:   fmt.Sprintf("%d", pm.Opponents[0].Opponent.ID),
					Name: pm.Opponents[0].Opponent.Name,
					Logo: pm.Opponents[0].Opponent.ImageURL,
				}
			} else {
				match.TeamA = models.Team{ID: "tbd1", Name: "TBD", Logo: ""}
			}

			if len(pm.Opponents) >= 2 {
				match.TeamB = models.Team{
					ID:   fmt.Sprintf("%d", pm.Opponents[1].Opponent.ID),
					Name: pm.Opponents[1].Opponent.Name,
					Logo: pm.Opponents[1].Opponent.ImageURL,
				}
			} else {
				match.TeamB = models.Team{ID: "tbd2", Name: "TBD", Logo: ""}
			}

			for _, res := range pm.Results {
				if match.TeamA.ID != "tbd1" && fmt.Sprintf("%d", res.TeamID) == match.TeamA.ID {
					match.TeamA.Score = res.Score
				} else if match.TeamB.ID != "tbd2" && fmt.Sprintf("%d", res.TeamID) == match.TeamB.ID {
					match.TeamB.Score = res.Score
				}
			}

			newMatches = append(newMatches, match)
		}
	}

	s.matches = newMatches
}
