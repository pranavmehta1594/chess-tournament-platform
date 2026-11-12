# ♚ Kingdom of Chess — Live Tournament Platform

A real-time, 1-on-1 tournament module designed for young chess masters. Coaches organize tournaments and oversee live games; students join, get auto-matched via concurrency-safe queues, play in real time with synchronized clocks on a server-authoritative board, and compete for top ranking on a live leaderboard.

---

## 🌟 Architecture & Tech Stack

This project was built to directly mirror the real production stack:

### Backend
- **Framework**: **NestJS 12** (TypeScript strict mode, modular architecture)
- **Database & Driver**: **PostgreSQL (Neon Serverless)** with connection pooling & SSL (`postgres.js`)
- **ORM & Migrations**: **Drizzle ORM** with **Drizzle Kit** declarative migrations
- **Real-Time Gateway**: **Socket.IO** (`@nestjs/websockets`, `@nestjs/platform-socket.io`)
- **Validation & Serialization**: Strict `class-validator` DTOs with standardized JSON response interceptors & exception filters
- **Chess Engine**: `chess.js` (Server-authoritative move validation, checkmate/stalemate detection, PGN generation)
- **Unit Testing**: Vitest test suite for scoring, Buchholz tiebreaks, join rules, and chess move legality

### Frontend
- **Framework**: **Next.js 16.4.6** with **React 19.3.0** (App Router, TypeScript strict mode)
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
The backend template is `backend/.env.example`. The root `.env.example` contains
both backend and frontend variables for reference; there is currently no
`frontend/.env.example` file.

```bash
# Run from the repository root
cp backend/.env.example backend/.env

# Create frontend/.env.local with:
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

PowerShell equivalent:

```powershell
Copy-Item backend/.env.example backend/.env
Set-Content frontend/.env.local "NEXT_PUBLIC_API_URL=http://localhost:3001`nNEXT_PUBLIC_SOCKET_URL=http://localhost:3001"
```

Configure your `DATABASE_URL` in `backend/.env`:
```env
# Example Neon connection string (SSL required):
DATABASE_URL=postgresql://<user>:<password>@<ep-pooler>.neon.tech/neondb?sslmode=require

# Or local PostgreSQL:
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/chess_db
```

The remaining backend variables are `PORT`, `NODE_ENV`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, and `FRONTEND_URL`. Frontend variables are
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_ENVIRONMENT`, and
`NEXT_PUBLIC_LIVE_API_URL`.

### Project Structure

- `backend/src/auth`: login, registration, JWT cookies, and role-aware identity
- `backend/src/tournaments`: tournament CRUD, joining, participants, and matches
- `backend/src/game`: Socket.IO gateway, matchmaking, clocks, and chess engine
- `backend/src/leaderboard`: scoring, Buchholz tiebreaks, and standings
- `backend/src/db`: Drizzle schema, migrations, database connection, and seed
- `frontend/src/app`: Next.js pages for login, tournaments, matches, and history
- `frontend/src/components/chess`: board, clocks, PGN, draw, and game-over UI
- `docker-compose.yml`: local PostgreSQL, backend, and frontend orchestration

### 3. Database Migrations & Seeding
In the `backend/` directory, run:

```bash
cd backend

# Run Drizzle migrations to create tables and indexes
npm run db:migrate

# Seed users (1 Coach + 4 Students) and initial tournament
npm run db:seed
```

`db:seed` is intended for a fresh local/demo database. It deletes existing
matches, tournament participants, tournaments, and users before inserting the
sample data. Do not run it against a database containing data you need to keep.

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

The Compose file is for local/demo use. It supplies a local PostgreSQL connection
and development JWT secret, exposes the frontend on port `3000`, the backend on
`3001`, and PostgreSQL on `5432`. For production, provide secrets through the
hosting platform and set the frontend `NEXT_PUBLIC_LIVE_API_URL` or
`NEXT_PUBLIC_API_URL` to the deployed backend URL. The frontend currently falls
back to `https://kingdom-of-chess-api-kopw.onrender.com` when
`NEXT_PUBLIC_ENVIRONMENT=production` and no live API URL is supplied.

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
| `match:started` | Server &rarr; Client | `{ matchId, whitePlayer, blackPlayer }` | Broadcast to a tournament room when matchmaking creates a match. |
| `leaderboard:updated` | Server &rarr; Client | `{ tournamentId: string, standings: LeaderboardRow[] }` | Broadcast to tournament room whenever any match in that tournament finishes. |

All Socket.IO connections must authenticate with the JWT supplied by login. The
client can send it as Socket.IO `auth.token`, a Bearer authorization header, or
the `access_token` cookie. Coaches may spectate matches; students may only join
matches in which they are participants.

---

## REST API Reference

The HTTP API is served under `/api/v1`. Successful responses use this envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Errors use `success: false`, `statusCode`, `error`, `message`, and `timestamp`.
Protected endpoints accept the `access_token` httpOnly cookie or a Bearer token.

### Health

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | No | Backend health check; returns `status: ok` and the service name. |

### Authentication

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | No | Log in with `{ email, password }`. |
| `POST` | `/api/v1/auth/register` | No | Register with `{ name, email, password, role? }`; passwords must be at least 6 characters. |
| `POST` | `/api/v1/auth/logout` | No | Clear the authentication cookie. |
| `GET` | `/api/v1/auth/me` | Yes | Return the current authenticated user. |

### Tournaments

| Method | Path | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tournaments` | Any signed-in user | List tournaments. |
| `GET` | `/api/v1/tournaments/:id` | Any signed-in user | Get tournament details. |
| `POST` | `/api/v1/tournaments` | Coach | Create a tournament. |
| `PATCH` | `/api/v1/tournaments/:id` | Coach | Update a tournament. |
| `DELETE` | `/api/v1/tournaments/:id` | Coach | Delete a tournament. |
| `POST` | `/api/v1/tournaments/:id/join` | Student | Join an open tournament. |
| `POST` | `/api/v1/tournaments/:id/add-student` | Coach | Add `{ studentId }` to a tournament. |
| `GET` | `/api/v1/tournaments/:id/leaderboard` | Any signed-in user | Get current standings. |
| `GET` | `/api/v1/tournaments/:id/matches` | Any signed-in user | List tournament matches. |

Tournament creation/update fields include `name`, `timeControl` (for example
`5+0` or `3+2`), `initialTimeSeconds` (minimum 30), `incrementSeconds`,
`startDateTime`, `status`, and, for updates, `winnerId`.

### Matches

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/matches/my-history` | Yes | List the current user's match history. |
| `GET` | `/api/v1/matches/:id` | Yes | Get match details. |

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
   - JWT is set in an `httpOnly` cookie and also returned in the login response. The frontend stores that returned token in `localStorage` and sends it as a Bearer token for API and Socket.IO compatibility; therefore the localStorage token must be treated as XSS-sensitive.
   - Cookies use `SameSite=Lax` during development and `SameSite=None; Secure` in production.
   - Role-Based Access Control (`RolesGuard`) enforces that students cannot access coach-only endpoints (`POST /tournaments`, `DELETE /tournaments`, etc.) and coaches cannot join student queues.
   - Socket.IO handshake parses the `httpOnly` cookie or bearer token, associating the client's identity to prevent unauthorized socket interactions.

---

## 🧪 Testing

Deterministic logic is covered with comprehensive unit tests in Vitest:

```bash
cd backend
npm test
```

Additional backend verification commands:

```bash
npm run test:e2e   # end-to-end tests
npm run test:cov   # coverage report
npm run lint       # type-aware linting
npm run build      # production backend build
```

To build and run the frontend in production mode:

```bash
cd frontend
npm run build
npm run start
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

