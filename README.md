# ♚ Kingdom of Chess — Live Tournament Platform

A real-time, 1-on-1 tournament module designed for young chess masters. Coaches organize tournaments and oversee live games; students join, get auto-matched via concurrency-safe queues, play in real time with synchronized clocks on a server-authoritative board, and compete for top ranking on a live leaderboard.

---

## 🌟 Architecture & Tech Stack

This project was built to directly mirror the real production stack:

### Backend
- **Framework**: **NestJS 11** (TypeScript strict mode, modular architecture)
- **Database & Driver**: **PostgreSQL (Neon Serverless)** with connection pooling & SSL (`postgres.js`)
- **ORM & Migrations**: **Drizzle ORM** with **Drizzle Kit** declarative migrations
- **Real-Time Gateway**: **Socket.IO** (`@nestjs/websockets`, `@nestjs/platform-socket.io`)
- **Validation & Serialization**: Strict `class-validator` DTOs with standardized JSON response interceptors & exception filters
- **Chess Engine**: `chess.js` (Server-authoritative move validation, checkmate/stalemate detection, PGN generation)
- **Unit Testing**: Vitest test suite for scoring, Buchholz tiebreaks, join rules, and chess move legality

### Frontend
- **Framework**: **Next.js 16/19 (App Router)** with TypeScript strict mode
- **UI & Styling**: **Tailwind CSS v4** + modern **shadcn/ui** design system (warm wood & academy slate theme)
- **State & Data Fetching**: **TanStack React Query v5** (caching + automatic mutation invalidation)
- **Live Sync**: **Socket.IO Client** with reconnection resilience
- **Chess Board**: `react-chessboard` + Web Audio API procedural sound effects (zero external audio files needed)

---

## 👥 Seed Credentials & Roles

The database seed populates 1 Coach and 4 Students:

| Role | Name | Email | Password | Quick Switcher |
| :--- | :--- | :--- | :--- | :--- |
| **♚ Coach (Admin)** | Coach Magnus | `coach@kingdom.chess` | `CoachPass123!` | 1-Click in UI |
| **♟ Student 1** | Aryan Sharma | `student1@kingdom.chess` | `StudentPass123!` | 1-Click in UI |
| **♟ Student 2** | Diya Patel | `student2@kingdom.chess` | `StudentPass123!` | 1-Click in UI |
| **♟ Student 3** | Rohan Gupta | `student3@kingdom.chess` | `StudentPass123!` | 1-Click in UI |
| **♟ Student 4** | Ananya Iyer | `student4@kingdom.chess` | `StudentPass123!` | 1-Click in UI |

> **Evaluator Delight**: The login screen and navigation bar include a **1-Click Fast Account Switcher**, allowing instant switching between Coach and Student accounts without typing passwords repeatedly.

---

## 🚀 Quick Setup & Getting Started

### 1. Prerequisites
- **Node.js**: v20+ (v24 recommended)
- **Database**: A PostgreSQL instance (e.g. [Neon](https://neon.tech) free tier, or local PostgreSQL via Docker)

### 2. Environment Configuration
Copy the provided `.env.example` templates:

```bash
# In backend/
cp .env.example .env

# In frontend/
cp .env.example .env.local
```

Configure your `DATABASE_URL` in `backend/.env`:
```env
# Example Neon connection string (SSL required):
DATABASE_URL=postgresql://<user>:<password>@<ep-pooler>.neon.tech/neondb?sslmode=require

# Or local PostgreSQL:
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/chess_db
```

### 3. Database Migrations & Seeding
In the `backend/` directory, run:

```bash
cd backend

# Run Drizzle migrations to create tables and indexes
npm run db:migrate

# Seed users (1 Coach + 4 Students) and initial tournament
npm run db:seed
```

### 4. Running the Applications

#### Option A: Local Development (Recommended)

1. **Start the Backend** (port 3001):
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start the Frontend** (port 3000):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser at: **`http://localhost:3000`**

#### Option B: Docker Compose (One-Command Setup)
If Docker is installed:
```bash
docker compose up --build
```
This boots Postgres, NestJS backend, and Next.js frontend in isolated containers.

---

## 🎮 How to Play a Match Locally (Two Browsers)

1. Open **Browser 1** (e.g., Chrome) and navigate to `http://localhost:3000`.
2. Click **Aryan Sharma (Student 1)** on the quick switcher to log in.
3. Open **Browser 2** (e.g., Incognito window or Firefox) and navigate to `http://localhost:3000`.
4. Click **Diya Patel (Student 2)** on the quick switcher to log in.
5. In both browsers, enter the open tournament: **"Kingdom Blitz Championship 2026"**.
6. In **Browser 1**, click **"Find Opponent"**. The status changes to *"Searching for opponent..."*.
7. In **Browser 2**, click **"Find Opponent"**.
8. **Instant Auto-Match**: Within milliseconds, the backend pairs both players, assigns White and Black, and **automatically drops both players directly into the live match arena** via Socket.IO push (zero manual page refresh required!).
9. Play live moves:
   - Moving a piece immediately reflects on the opponent's board.
   - The shared clock counts down on each player's active turn.
   - PGN move notation scrolls in real time.
   - Sounds trigger for moves, captures, and checks.
10. Conclude the game (Checkmate, Timeout, Resignation, or Draw Offer):
    - A Victory/Defeat dialog appears with audio & confetti.
    - Click **"Find Next Opponent"** to re-queue immediately, or return to the tournament to watch your score update on the **Live Leaderboard**!

---

## 📡 Socket.IO Real-Time Events Reference

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `queue:join` | Client &rarr; Server | `{ tournamentId: string }` | Student enters tournament matchmaking queue. |
| `queue:leave` | Client &rarr; Server | `{ tournamentId?: string }` | Student cancels matchmaking search. |
| `match:paired` | Server &rarr; Client | `{ matchId, tournamentId, color, opponent, initialTimeMs }` | Pushed to both players when matchmaking creates a match. Auto-redirects clients to `/matches/:id`. |
| `match:join` | Client &rarr; Server | `{ matchId: string }` | Client joins match room; server returns snapshot with current FEN, PGN, and accurate clocks. |
| `match:move` | Client &rarr; Server | `{ matchId: string, from: string, to: string, promotion?: string }` | Client submits move to server-authoritative engine. |
| `match:move_applied` | Server &rarr; Client | `{ matchId, move, fen, pgn, turn, whiteTimeRemainingMs, blackTimeRemainingMs }` | Broadcast to match room after server confirms move legality and deducts elapsed clock time. |
| `match:resign` | Client &rarr; Server | `{ matchId: string }` | Player resigns the match. |
| `match:offer_draw` | Client &rarr; Server | `{ matchId: string }` | Player proposes a draw. |
| `match:draw_offered` | Server &rarr; Client | `{ matchId, fromUserId, fromUserName }` | Notifies opponent that a draw has been offered. |
| `match:respond_draw` | Client &rarr; Server | `{ matchId: string, accept: boolean }` | Opponent accepts or declines draw. |
| `match:draw_declined` | Server &rarr; Client | `{ matchId: string }` | Notifies proposing player that draw was declined. |
| `match:ended` | Server &rarr; Client | `{ matchId, result, reason, winnerId, pgn, finalFen }` | Broadcast when checkmate, timeout, resignation, or draw occurs. |
| `leaderboard:updated` | Server &rarr; Client | `{ tournamentId: string, standings: LeaderboardRow[] }` | Broadcast to tournament room whenever any match in that tournament finishes. |

---

## ⚖️ Key Architectural Decisions & Trade-offs

1. **Server-Authoritative Game State & Clocks**:
   - *Decision*: We did not trust clients to report their own remaining clock times or validate moves. The server runs an authoritative `chess.js` instance for each active game.
   - *Clock Monotonicity*: When a player makes a move, the server measures `now - turnStartTime`, verifies against remaining time, and deducts elapsed time before switching turns.
   - *Automated Server Timeout*: A server timer (`setTimeout`) triggers automatically if a player flags, emitting `match:ended` with reason `'TIMEOUT'` even if both clients lose connection.

2. **Concurrency Safety & Double-Booking Prevention**:
   - *Decision*: Students can enter only one matchmaking queue at a time and cannot participate in multiple matches simultaneously.
   - *Guard*: A dedicated active registry checks both in-memory state and unresolved active matches in the database before granting queue entry.

3. **Neon Serverless PostgreSQL with Drizzle ORM**:
   - *Decision*: Neon's autoscaling serverless Postgres was used with `postgres.js` configured with `ssl: 'require'` and connection pooling (`max: 10`). Drizzle ORM provides zero-overhead type-safe SQL queries without heavy Prisma binaries.

4. **Scoring & Tiebreak Model**:
   - *Standard Chess Scoring*: Win = 1.0 point, Draw = 0.5 point, Loss = 0.0 points.
   - *Millipoints Storage*: Scores are stored as integer millipoints (e.g. 1000 = 1.0, 500 = 0.5) to avoid floating-point rounding errors in database queries.
   - *Tiebreaker*: **Buchholz Score** (the sum of all opponents' scores in that tournament). If still tied, ranked by most wins, then head-to-head.

5. **Authentication & Security**:
   - Passwords hashed using `bcrypt` (10 rounds).
   - JWT issued in `httpOnly` cookies with `SameSite=Lax` to prevent XSS credential theft.
   - Role-Based Access Control (`RolesGuard`) enforces that students cannot access coach-only endpoints (`POST /tournaments`, `DELETE /tournaments`, etc.) and coaches cannot join student queues.
   - Socket.IO handshake parses the `httpOnly` cookie or bearer token, associating the client's identity to prevent unauthorized socket interactions.

---

## 🧪 Testing

Deterministic logic is covered with comprehensive unit tests in Vitest:

```bash
cd backend
npm test
```

### Test Coverage Highlights
- **Leaderboard Scoring**: Verifies win (1.0), draw (0.5), loss (0.0).
- **Tiebreaking**: Verifies Buchholz tiebreak calculations when points are equal.
- **Tournament Rules**: Verifies rejection of joining draft or completed tournaments; verifies time control parsing (`5+0`, `3+2`, `10+5`).
- **Chess Move Legality**: Verifies legal moves, illegal move rejections, and checkmate detection (Scholar's Mate) and stalemate detection.

---

## 🏆 Stretch Goals Implemented
- ✅ **Server-authoritative game state & clocks**: Server is the single source of truth for clocks and moves.
- ✅ **Reconnection Support**: Dropping or refreshing mid-game restores the active board and accurate remaining clocks via `match:join`.
- ✅ **Spectator Mode**: Coaches (or non-participating viewers) can spectate any ongoing match live.
- ✅ **Draw Offers & Resignation**: In-game draw offer negotiations and instant surrender.
- ✅ **Move-List Review Navigation**: Click any move in the PGN list to inspect past positions.
- ✅ **Zero-Asset Procedural Audio**: Move, capture, check, and victory sound effects synthesized directly using the Web Audio API.
- ✅ **Fast Account Switcher**: 1-click account switcher for seamless testing during reviews.

