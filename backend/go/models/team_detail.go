package models

type Player struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Role      string `json:"role"`
	ImageURL  string `json:"imageUrl"`
	Nationality string `json:"nationality"`
}

type TeamDetail struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Acronym  string   `json:"acronym"`
	ImageURL string   `json:"imageUrl"`
	Players  []Player `json:"players"`
}
