package service

import (
	"context"
	"errors"

	"github.com/micael/allstats/backend/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	collection *mongo.Collection
}

func NewAuthService(db *mongo.Database) *AuthService {
	return &AuthService{
		collection: db.Collection("users"),
	}
}

func (s *AuthService) Register(req models.RegisterRequest) error {
	// Check if user already exists
	var existing models.User
	err := s.collection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&existing)
	if err == nil {
		return errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
	}

	_, err = s.collection.InsertOne(context.Background(), user)
	return err
}

func (s *AuthService) Login(req models.LoginRequest) (*models.User, error) {
	var user models.User
	err := s.collection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Compare password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Initialize favoriteTournaments if nil to avoid frontend issues
	if user.FavoriteTournaments == nil {
		user.FavoriteTournaments = []string{}
	}

	return &user, nil
}

func (s *AuthService) GetUserByID(id string) (*models.User, error) {
	objID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var user models.User
	err = s.collection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) UpdateProfilePicture(userID string, pictureData string) error {
	objID, err := bson.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	_, err = s.collection.UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"profilePicture": pictureData}},
	)
	return err
}

func (s *AuthService) AddFavoriteTournament(userID string, tournamentID string) error {
	objID, err := bson.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	_, err = s.collection.UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		bson.M{"$addToSet": bson.M{"favoriteTournaments": tournamentID}},
	)
	return err
}

func (s *AuthService) RemoveFavoriteTournament(userID string, tournamentID string) error {
	objID, err := bson.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	_, err = s.collection.UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		bson.M{"$pull": bson.M{"favoriteTournaments": tournamentID}},
	)
	return err
}

func (s *AuthService) DeleteUser(id string) error {
	objID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	_, err = s.collection.DeleteOne(context.Background(), bson.M{"_id": objID})
	return err
}

func (s *AuthService) UpdateProfile(userID string, req models.UpdateProfileRequest) (*models.User, error) {
	objID, err := bson.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Fetch current user
	var currentUser models.User
	err = s.collection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&currentUser)
	if err != nil {
		return nil, err
	}

	updateFields := bson.M{}

	// If email changes, check uniqueness
	if req.Email != "" && req.Email != currentUser.Email {
		var existing models.User
		err = s.collection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&existing)
		if err == nil {
			return nil, errors.New("user with this email already exists")
		}
		updateFields["email"] = req.Email
	}

	if req.Username != "" {
		updateFields["username"] = req.Username
	}

	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		updateFields["password"] = string(hashedPassword)
	}

	if len(updateFields) > 0 {
		_, err = s.collection.UpdateOne(
			context.Background(),
			bson.M{"_id": objID},
			bson.M{"$set": updateFields},
		)
		if err != nil {
			return nil, err
		}
	}

	// Retrieve the updated user
	var updatedUser models.User
	err = s.collection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&updatedUser)
	if err != nil {
		return nil, err
	}

	// Initialize favoriteTournaments if nil to avoid frontend issues
	if updatedUser.FavoriteTournaments == nil {
		updatedUser.FavoriteTournaments = []string{}
	}

	return &updatedUser, nil
}

