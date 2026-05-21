package models

import "go.mongodb.org/mongo-driver/v2/bson"

type User struct {
	ID             bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Username       string        `bson:"username" json:"username"`
	Email          string        `bson:"email" json:"email"`
	Password       string        `bson:"password" json:"password"`
	ProfilePicture string        `bson:"profilePicture" json:"profilePicture"`
	FavoriteTournaments []string `bson:"favoriteTournaments,omitempty" json:"favoriteTournaments"`
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
