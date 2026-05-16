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

func (s *PandaScoreService) GetLeagueDetails(id string) (interface{}, error) {
	url := fmt.Sprintf("https://api.pandascore.co/leagues/%s", id)
	data, _, err := s.getJson(url)
	return data, err
}

func (s *PandaScoreService) GetSeriesInfo(id string) (interface{}, error) {
	url := fmt.Sprintf("https://api.pandascore.co/series/%s", id)
	data, _, err := s.getJson(url)
	return data, err
}

func (s *PandaScoreService) GetSeriesTeams(id string) ([]models.TeamDetail, error) {
	fmt.Printf("GetSeriesTeams: Fetching series %s to find tournaments...\n", id)
	
	seriesUrl := fmt.Sprintf("https://api.pandascore.co/series/%s", id)
	client := &http.Client{}
	req, _ := http.NewRequest("GET", seriesUrl, nil)
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var series struct {
		Tournaments []struct {
			ID int `json:"id"`
		} `json:"tournaments"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&series); err != nil {
		return nil, err
	}

	if len(series.Tournaments) == 0 {
		return []models.TeamDetail{}, nil
	}

	tournamentId := series.Tournaments[0].ID
	teamsUrl := fmt.Sprintf("https://api.pandascore.co/tournaments/%d/teams", tournamentId)
	reqT, _ := http.NewRequest("GET", teamsUrl, nil)
	reqT.Header.Set("Authorization", "Bearer "+s.token)
	reqT.Header.Set("Accept", "application/json")

	respT, err := client.Do(reqT)
	if err != nil {
		return nil, err
	}
	defer respT.Body.Close()

	var batch []struct {
		ID       int    `json:"id"`
		Name     string `json:"name"`
		Acronym  string `json:"acronym"`
		ImageURL string `json:"image_url"`
		Players  []struct {
			ID          int    `json:"id"`
			Name        string `json:"name"`
			FirstName   string `json:"first_name"`
			LastName    string `json:"last_name"`
			Role        string `json:"role"`
			ImageURL    string `json:"image_url"`
			Nationality string `json:"nationality"`
		} `json:"players"`
	}

	if err := json.NewDecoder(respT.Body).Decode(&batch); err != nil {
		return nil, err
	}

	teams := []models.TeamDetail{}
	for _, pt := range batch {
		players := []models.Player{}
		for _, pp := range pt.Players {
			players = append(players, models.Player{
				ID:          fmt.Sprintf("%d", pp.ID),
				Name:        pp.Name,
				FirstName:   pp.FirstName,
				LastName:    pp.LastName,
				Role:        pp.Role,
				ImageURL:    pp.ImageURL,
				Nationality: pp.Nationality,
			})
		}
		teams = append(teams, models.TeamDetail{
			ID:       fmt.Sprintf("%d", pt.ID),
			Name:     pt.Name,
			Acronym:  pt.Acronym,
			ImageURL: pt.ImageURL,
			Players:  players,
		})
	}
	return teams, nil
}

func (s *PandaScoreService) GetSeriesMatches(id string) ([]models.Match, error) {
	url := fmt.Sprintf("https://api.pandascore.co/series/%s/matches?sort=begin_at&per_page=100", id)
	
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var batch []struct {
		ID       int    `json:"id"`
		Status   string `json:"status"`
		BeginAt  string `json:"begin_at"`
		NumberOfGames int `json:"number_of_games"`
		Games    []struct {
			Status string `json:"status"`
			Position int `json:"position"`
			Results []struct {
				TeamID int `json:"team_id"`
				Score  int `json:"score"`
			} `json:"results"`
		} `json:"games"`
		Videogame struct {
			Slug string `json:"slug"`
		} `json:"videogame"`
		Tournament struct {
			Name string `json:"name"`
		} `json:"tournament"`
		League struct {
			Name string `json:"name"`
		} `json:"league"`
		Opponents []struct {
			Opponent struct {
				ID       int    `json:"id"`
				Name     string `json:"name"`
				ImageURL string `json:"image_url"`
			} `json:"opponent"`
		} `json:"opponents"`
		Results []struct {
			Score  int `json:"score"`
			TeamID int `json:"team_id"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&batch); err != nil {
		return nil, err
	}

	matches := []models.Match{}
	for _, pm := range batch {
		var displayGame models.GameType
		switch pm.Videogame.Slug {
		case "csgo", "cs-go", "cs-2", "cs2":
			displayGame = models.CS2
		case "valorant":
			displayGame = models.Valorant
		case "league-of-legends":
			displayGame = models.LoL
		default:
			continue
		}

		status := pm.Status
		if status == "running" {
			status = "live"
		} else if status == "not_started" {
			status = "upcoming"
		}

		currentGame := 0
		if status == "live" {
			for _, g := range pm.Games {
				if g.Status == "running" {
					currentGame = g.Position
					break
				}
			}
			if currentGame == 0 && len(pm.Games) > 0 {
				for _, g := range pm.Games {
					if g.Status != "finished" {
						currentGame = g.Position
						break
					}
				}
			}
		} else if status == "finished" {
			currentGame = pm.NumberOfGames
		}

		match := models.Match{
			ID:            fmt.Sprintf("%d", pm.ID),
			Status:        status,
			Game:          displayGame,
			StartTime:     pm.BeginAt,
			Stage:         pm.Tournament.Name,
			LeagueName:    pm.League.Name,
			NumberOfGames: pm.NumberOfGames,
			CurrentGame:   currentGame,
		}

		// Extract Map-specific scores (rounds/points)
		if currentGame > 0 {
			for _, g := range pm.Games {
				if g.Position == currentGame {
					for _, res := range g.Results {
						if len(pm.Opponents) >= 1 && fmt.Sprintf("%d", res.TeamID) == fmt.Sprintf("%d", pm.Opponents[0].Opponent.ID) {
							match.CurrentMapScoreA = res.Score
						} else if len(pm.Opponents) >= 2 && fmt.Sprintf("%d", res.TeamID) == fmt.Sprintf("%d", pm.Opponents[1].Opponent.ID) {
							match.CurrentMapScoreB = res.Score
						}
					}
					break
				}
			}
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

		matches = append(matches, match)
	}

	return matches, nil
}

func (s *PandaScoreService) GetTournamentStandings(id string) (interface{}, error) {
	url := fmt.Sprintf("https://api.pandascore.co/tournaments/%s/standings", id)
	data, code, err := s.getJson(url)
	if code == http.StatusNotFound {
		return []interface{}{}, nil
	}
	return data, err
}

func (s *PandaScoreService) GetTournamentBrackets(id string) (interface{}, error) {
	url := fmt.Sprintf("https://api.pandascore.co/tournaments/%s/brackets", id)
	data, code, err := s.getJson(url)
	if code == http.StatusNotFound {
		return []interface{}{}, nil
	}
	return data, err
}

func (s *PandaScoreService) SearchTeams(query string) ([]models.TeamSimple, error) {
	url := fmt.Sprintf("https://api.pandascore.co/teams?search[name]=%s&per_page=20", query)
	
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var batch []struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		ImageURL  string `json:"image_url"`
		Videogame struct {
			Name string `json:"name"`
		} `json:"videogame"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&batch); err != nil {
		return nil, err
	}

	teams := []models.TeamSimple{}
	for _, pt := range batch {
		teams = append(teams, models.TeamSimple{
			ID:   fmt.Sprintf("%d", pt.ID),
			Name: pt.Name,
			Logo: pt.ImageURL,
			Game: pt.Videogame.Name,
		})
	}
	return teams, nil
}

func (s *PandaScoreService) getJson(url string) (interface{}, int, error) {
	fmt.Printf("getJson: Fetching %s\n", url)
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("getJson error: %v\n", err)
		return nil, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("getJson: API returned status %d for %s\n", resp.StatusCode, url)
		return nil, resp.StatusCode, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var data interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		fmt.Printf("getJson decode error: %v\n", err)
		return nil, resp.StatusCode, err
	}
	return data, resp.StatusCode, nil
}

func (s *PandaScoreService) GetTeamsMatches(teamIDs []string) ([]models.Match, error) {
	if len(teamIDs) == 0 {
		return []models.Match{}, nil
	}

	idsStr := ""
	for i, id := range teamIDs {
		if i > 0 {
			idsStr += ","
		}
		idsStr += id
	}

	// Filter for running and not_started to show what's relevant now and next
	url := fmt.Sprintf("https://api.pandascore.co/matches?filter[opponent_id]=%s&filter[status]=running,not_started&sort=begin_at&per_page=50", idsStr)
	
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var batch []struct {
		ID       int    `json:"id"`
		Status   string `json:"status"`
		BeginAt  string `json:"begin_at"`
		NumberOfGames int `json:"number_of_games"`
		Games    []struct {
			Status string `json:"status"`
			Position int `json:"position"`
			Results []struct {
				TeamID int `json:"team_id"`
				Score  int `json:"score"`
			} `json:"results"`
		} `json:"games"`
		Videogame struct {
			Slug string `json:"slug"`
		} `json:"videogame"`
		Tournament struct {
			Name string `json:"name"`
		} `json:"tournament"`
		League struct {
			Name string `json:"name"`
		} `json:"league"`
		Opponents []struct {
			Opponent struct {
				ID       int    `json:"id"`
				Name     string `json:"name"`
				ImageURL string `json:"image_url"`
			} `json:"opponent"`
		} `json:"opponents"`
		Results []struct {
			Score  int `json:"score"`
			TeamID int `json:"team_id"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&batch); err != nil {
		return nil, err
	}

	matches := []models.Match{}
	for _, pm := range batch {
		var displayGame models.GameType
		switch pm.Videogame.Slug {
		case "csgo", "cs-go", "cs-2", "cs2":
			displayGame = models.CS2
		case "valorant":
			displayGame = models.Valorant
		case "league-of-legends":
			displayGame = models.LoL
		default:
			continue
		}

		status := pm.Status
		if status == "running" {
			status = "live"
		} else if status == "not_started" {
			status = "upcoming"
		}

		currentGame := 0
		if status == "live" {
			for _, g := range pm.Games {
				if g.Status == "running" {
					currentGame = g.Position
					break
				}
			}
		}

		match := models.Match{
			ID:            fmt.Sprintf("%d", pm.ID),
			Status:        status,
			Game:          displayGame,
			StartTime:     pm.BeginAt,
			Stage:         pm.Tournament.Name,
			LeagueName:    pm.League.Name,
			NumberOfGames: pm.NumberOfGames,
			CurrentGame:   currentGame,
		}

		if currentGame > 0 {
			for _, g := range pm.Games {
				if g.Position == currentGame {
					for _, res := range g.Results {
						if len(pm.Opponents) >= 1 && fmt.Sprintf("%d", res.TeamID) == fmt.Sprintf("%d", pm.Opponents[0].Opponent.ID) {
							match.CurrentMapScoreA = res.Score
						} else if len(pm.Opponents) >= 2 && fmt.Sprintf("%d", res.TeamID) == fmt.Sprintf("%d", pm.Opponents[1].Opponent.ID) {
							match.CurrentMapScoreB = res.Score
						}
					}
				}
			}
		}

		if len(pm.Opponents) >= 1 {
			match.TeamA = models.Team{ID: fmt.Sprintf("%d", pm.Opponents[0].Opponent.ID), Name: pm.Opponents[0].Opponent.Name, Logo: pm.Opponents[0].Opponent.ImageURL}
		} else {
			match.TeamA = models.Team{ID: "tbd1", Name: "TBD"}
		}
		if len(pm.Opponents) >= 2 {
			match.TeamB = models.Team{ID: fmt.Sprintf("%d", pm.Opponents[1].Opponent.ID), Name: pm.Opponents[1].Opponent.Name, Logo: pm.Opponents[1].Opponent.ImageURL}
		} else {
			match.TeamB = models.Team{ID: "tbd2", Name: "TBD"}
		}

		for _, res := range pm.Results {
			if match.TeamA.ID != "tbd1" && fmt.Sprintf("%d", res.TeamID) == match.TeamA.ID {
				match.TeamA.Score = res.Score
			} else if match.TeamB.ID != "tbd2" && fmt.Sprintf("%d", res.TeamID) == match.TeamB.ID {
				match.TeamB.Score = res.Score
			}
		}

		matches = append(matches, match)
	}

	return matches, nil
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

	// 1. Identify active leagues from running matches
	activeLeagueIDs := make(map[int]bool)
	urlMatches := "https://api.pandascore.co/matches?filter[status]=running&videogame=league-of-legends,csgo,valorant&per_page=50"
	reqM, _ := http.NewRequest("GET", urlMatches, nil)
	reqM.Header.Set("Authorization", "Bearer "+s.token)
	reqM.Header.Set("Accept", "application/json")
	
	respM, err := client.Do(reqM)
	if err == nil && respM.StatusCode == http.StatusOK {
		var liveMatches []struct {
			League struct {
				ID int `json:"id"`
			} `json:"league"`
		}
		if err := json.NewDecoder(respM.Body).Decode(&liveMatches); err == nil {
			for _, m := range liveMatches {
				activeLeagueIDs[m.League.ID] = true
			}
		}
		respM.Body.Close()
	}

	// 2. Fetch general leagues (10 pages)
	for page := 1; page <= 10; page++ {
		url := fmt.Sprintf("https://api.pandascore.co/leagues?filter[videogame_id]=1,3,26&sort=name&page=%d&per_page=100", page)
		
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
			default:
				continue
			}

			status := "running"
			if activeLeagueIDs[pl.ID] {
				status = "live"
			}

			newTournaments = append(newTournaments, models.Tournament{
				ID:       fmt.Sprintf("%d", pl.ID),
				Name:     pl.Name,
				Game:     displayGame,
				Status:   status,
				League:   pl.Name,
				ImageURL: pl.ImageURL,
			})
		}
	}
	s.tournaments = newTournaments
}

func (s *PandaScoreService) fetchFromPandaScore() {
	games := []string{"league-of-legends", "csgo", "valorant"}
	newMatches := []models.Match{}

	client := &http.Client{}

	for _, gameSlug := range games {
		// 1. Fetch Live and Upcoming (Ascending)
		urlUpcoming := fmt.Sprintf("https://api.pandascore.co/matches?filter[videogame]=%s&filter[status]=running,not_started&sort=begin_at&page=1&per_page=20", gameSlug)
		
		// 2. Fetch Recent Finished (Descending)
		urlFinished := fmt.Sprintf("https://api.pandascore.co/matches?filter[videogame]=%s&filter[status]=finished&sort=-begin_at&page=1&per_page=10", gameSlug)

		for _, url := range []string{urlUpcoming, urlFinished} {
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
				NumberOfGames int `json:"number_of_games"`
				Games    []struct {
					Status string `json:"status"`
					Position int `json:"position"`
					Results []struct {
						TeamID int `json:"team_id"`
						Score  int `json:"score"`
					} `json:"results"`
				} `json:"games"`
				Videogame struct {
					Slug string `json:"slug"`
				} `json:"videogame"`
				Tournament struct {
					Name string `json:"name"`
				} `json:"tournament"`
				League struct {
					Name string `json:"name"`
				} `json:"league"`
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
				default:
					continue
				}

				status := pm.Status
				if status == "running" {
					status = "live"
				} else if status == "not_started" {
					status = "upcoming"
				}

				currentGame := 0
				if status == "live" {
					for _, g := range pm.Games {
						if g.Status == "running" {
							currentGame = g.Position
							break
						}
					}
					if currentGame == 0 && len(pm.Games) > 0 {
						for _, g := range pm.Games {
							if g.Status != "finished" {
								currentGame = g.Position
								break
							}
						}
					}
				} else if status == "finished" {
					currentGame = pm.NumberOfGames
				}

				match := models.Match{
					ID:            fmt.Sprintf("%d", pm.ID),
					Status:        status,
					Game:          displayGame,
					StartTime:     pm.BeginAt,
					Stage:         pm.Tournament.Name,
					LeagueName:    pm.League.Name,
					NumberOfGames: pm.NumberOfGames,
					CurrentGame:   currentGame,
				}

				// Extract Map-specific scores (rounds/points)
				if currentGame > 0 {
					for _, g := range pm.Games {
						if g.Position == currentGame {
							for _, res := range g.Results {
								if len(pm.Opponents) >= 1 && fmt.Sprintf("%d", res.TeamID) == fmt.Sprintf("%d", pm.Opponents[0].Opponent.ID) {
									match.CurrentMapScoreA = res.Score
								} else if len(pm.Opponents) >= 2 && fmt.Sprintf("%d", res.TeamID) == fmt.Sprintf("%d", pm.Opponents[1].Opponent.ID) {
									match.CurrentMapScoreB = res.Score
								}
							}
							break
						}
					}
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
	}

	s.matches = newMatches
}
