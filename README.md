![AllStats Logo](/frontend/react/public/iconallstats.png)

AllStats is a modern, ultra-minimalist esports dashboard designed for fans who want to track their favorite games, teams, and tournaments with high-density information and zero clutter.

## 🚀 Key Features

### 🎮 Real-Time Match Tracking
- **Live Scores:** Real-time map wins and match status updates via WebSockets.
- **Minimalist Rows:** High-density view showing 5 matches per game (LoL, CS2, Valorant).
- **Hover Popups:** Quick-look tooltips with team logos, detailed timing, and championship info.
- **Recent Results:** A dedicated history section for the last 5 finished matches.

### 🏆 Tournament Deep-Dive
- **Global Discovery:** Search through over 1,000 official leagues and tournaments.
- **Phased Organization:** Matches automatically grouped by stages (Regular Season, Playoffs, etc.).
- **Dynamic Standings:** Automatic detection of tournament type to show either **Brackets** or **Tables**.
- **Real Rosters:** Full team lists with player names, nicknames, and official photos.

### 👤 Personalized Experience
- **User Accounts:** Secure registration and login system backed by MongoDB.
- **Favorite Teams:** Choose your heart teams for each game in your profile.
- **Smart Home:** A dedicated "MY FAVORITES" section at the top of the home page for your teams.

## 🛠️ Tech Stack

### Backend
- **Language:** Go (Golang) 1.25+
- **Framework:** Gin Gonic
- **Database:** MongoDB
- **Real-time:** Gorilla WebSocket
- **External API:** PandaScore (Esports Data)

### Frontend
- **Library:** React 19 (TypeScript)
- **Tooling:** Vite
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Typography:** Inter (Body) & Montserrat (Display)

## 📦 Project Structure

```text
.
├── backend/go             # Go Gin Server
│   ├── models/           # Data Structures
│   ├── service/          # API & Business Logic
│   ├── ws/               # WebSocket Hub
│   └── main.go           # Entry point
├── frontend/react         # React Vite Client
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── services/     # API & WS Services
│   │   ├── styles/       # Global & Component CSS
│   │   └── types/        # TypeScript Definitions
└── docker-compose.dev.yml # Local Development Setup
```

## ⚙️ Setup & Installation

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/)
- [PandaScore API Token](https://pandascore.co/) (Free tier available)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/micael/allstats.git
   cd allstats
   ```

2. **Configure Environment:**
   Create a `.env` file inside `backend/go/`:
   ```env
   PANDA_SCORE_TOKEN=your_token_here
   MONGO_URI=mongodb://mongodb:27017/allstats
   ```

3. **Spin up the environment:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

4. **Access the Application:**
   - **Frontend:** `http://localhost:5173`
   - **Backend API:** `http://localhost:8080/api`

## 🎨 Visual Identity
The project uses a dark, high-contrast theme focused on performance and readability.
- **Inter:** Chosen for clean data reading.
- **Montserrat:** Bold headers for a "premium" esports feel.

## 📜 License
This project is licensed under the MIT License.

---
*Created by [Micael](https://github.com/micael)*
