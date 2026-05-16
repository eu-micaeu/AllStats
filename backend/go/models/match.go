package models

type GameType string

const (
	LoL       GameType = "League of Legends"
	CS2       GameType = "Counter-Strike 2"
	Valorant  GameType = "Valorant"
	Overwatch GameType = "Overwatch"
)

type Team struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Logo  string `json:"logo"`
	Score int    `json:"score"`
}

type Match struct {
	ID        string   `json:"id"`
	Game      GameType `json:"game"`
	TeamA     Team     `json:"teamA"`
	TeamB     Team     `json:"teamB"`
	Status    string   `json:"status"` // "live", "finished", "upcoming"
	GameTime  string   `json:"gameTime"`
	StartTime string   `json:"startTime"`
}
