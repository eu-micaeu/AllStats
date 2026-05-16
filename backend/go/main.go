package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/micael/allstats/backend/models"
	"github.com/micael/allstats/backend/service"
	"github.com/micael/allstats/backend/ws"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// MongoDB Connection
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017/allstats"
	}
	log.Printf("Connecting to MongoDB at: %s", mongoURI)

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	client, err := mongo.Connect(options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to create MongoDB client: %v", err)
	}
	
	// Ping the database to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Failed to connect to MongoDB (Ping): %v", err)
	}
	log.Println("Successfully connected to MongoDB")

	defer client.Disconnect(ctx)

	db := client.Database("allstats")
	authService := service.NewAuthService(db)

	r := gin.Default()

	pandaToken := os.Getenv("PANDA_SCORE_TOKEN")
	if pandaToken == "" {
		log.Fatal("PANDA_SCORE_TOKEN environment variable is required")
	}
	psService := service.NewPandaScoreService(pandaToken)
	hub := ws.NewHub()
	go hub.Run()

	// Connect PandaScore updates to hub broadcast
	go func() {
		for update := range psService.Updates() {
			hub.Broadcast(update)
		}
	}()

	// REST API
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "up"})
	})

	r.GET("/api/matches", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"matches": psService.GetMatches()})
	})

	r.GET("/api/tournaments", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"tournaments": psService.GetTournaments()})
	})

	r.GET("/api/leagues/:id", func(c *gin.Context) {
		id := c.Param("id")
		league, err := psService.GetLeagueDetails(id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "League not found"})
			return
		}
		c.JSON(http.StatusOK, league)
	})

	r.GET("/api/series/:id", func(c *gin.Context) {
		id := c.Param("id")
		series, err := psService.GetSeriesInfo(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, series)
	})

	r.GET("/api/series/:id/teams", func(c *gin.Context) {
		id := c.Param("id")
		teams, err := psService.GetSeriesTeams(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"teams": teams})
	})

	r.GET("/api/series/:id/matches", func(c *gin.Context) {
		id := c.Param("id")
		matches, err := psService.GetSeriesMatches(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"matches": matches})
	})

	r.GET("/api/tournaments/:id/standings", func(c *gin.Context) {
		id := c.Param("id")
		standings, err := psService.GetTournamentStandings(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, standings)
	})

	r.GET("/api/tournaments/:id/brackets", func(c *gin.Context) {
		id := c.Param("id")
		brackets, err := psService.GetTournamentBrackets(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, brackets)
	})

	// Auth Routes
	r.POST("/api/register", func(c *gin.Context) {
		var req models.RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := authService.Register(req); err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
	})

	r.POST("/api/login", func(c *gin.Context) {
		var req models.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		user, err := authService.Login(req)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Login successful",
			"user":    user,
		})
	})

	// WebSocket
	r.GET("/ws/live", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("Failed to upgrade to websocket: %v", err)
			return
		}
		
		hub.Register(conn)
		
		// Wait for connection to close
		defer hub.Unregister(conn)
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	})

	log.Println("Backend starting on :8080")
	r.Run(":8080")
}
