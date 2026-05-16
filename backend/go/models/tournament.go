package models

type Tournament struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Game      GameType `json:"game"`
	Status    string   `json:"status"` // "running", "upcoming", "past"
	BeginAt   string   `json:"beginAt"`
	EndAt     string   `json:"endAt"`
	League    string   `json:"league"`
	ImageURL  string   `json:"imageUrl"`
}
