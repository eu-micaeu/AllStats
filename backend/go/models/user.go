package models

import "go.mongodb.org/mongo-driver/v2/bson"

type TeamSimple struct {
	ID       string `bson:"id" json:"id"`
	Name     string `bson:"name" json:"name"`
	Logo     string `bson:"logo" json:"logo"`
	Game     string `bson:"game" json:"game"`
}

type User struct {
	ID            bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Username      string        `bson:"username" json:"username"`
	Email         string        `bson:"email" json:"email"`
	Password      string        `bson:"password" json:"-"` // Never return password in JSON
	FavoriteTeams []TeamSimple  `bson:"favoriteTeams" json:"favoriteTeams"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}
