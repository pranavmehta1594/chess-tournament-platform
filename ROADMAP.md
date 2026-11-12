# Kingdom of Chess — Tournament Platform Roadmap & Checklist

> Status reflects the implementation currently present in this repository. The
> project is split into independent `backend/` and `frontend/` npm applications.
>
> Golden path: **sign in → join a tournament → find an opponent → play a live
> match → see the updated leaderboard and match history**.

## Progress

| Phase | Status |
|---|---|
| 0 — Repository and setup | ✅ Implemented |
| 1 — Data model and authentication | ✅ Implemented |
| 2 — Tournament management | ✅ Implemented |
| 3 — Matchmaking | ✅ Implemented |
| 4 — Live match loop | ✅ Implemented |
| 5 — Leaderboard and scoring | ✅ Implemented |
| 6 — Frontend experience | ✅ Implemented |
| 7 — Testing and documentation | 🟡 In progress |
| 8 — Production hardening | 🟡 Planned |

---

## Architecture at a glance

```text
backend/                         NestJS 12 API, port 3001
  src/auth/                      login, registration, JWT, roles
  src/db/                        Drizzle schema, migrations, seed
  src/tournaments/               tournament CRUD and participation
  src/leaderboard/               scoring, Buchholz, standings
  src/game/                      Socket.IO gateway, queues, clocks, chess engine
  src/matches/                   match detail and user history endpoints
  drizzle/                       PostgreSQL migrations

frontend/                        Next.js 16.4.6 + React 19.3, port 3000
  src/app/                       login, tournaments, matches, match history
  src/components/chess/           board, clocks, PGN, draw, game-over UI
  src/components/ui/              navigation and reusable UI components
  src/lib/                       API configuration, Socket.IO, sounds, utilities

docker-compose.yml                PostgreSQL 16, backend, and frontend
```

### Key decisions

| Area | Current decision |
|---|---|
| Repository | Separate `backend/` and `frontend/` npm projects with independent lockfiles; this is not an npm-workspaces monorepo. |
| Backend | NestJS 12, TypeScript, modular services, global validation, response interceptor, and exception filter. |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Radix/shadcn-style components, and TanStack React Query. |
| Auth | Email/password authentication with `bcryptjs`; JWT is set in the `access_token` cookie and also returned by login/register. The frontend stores the returned token in `localStorage` and sends it as a Bearer token for API and Socket.IO compatibility. |
| Roles | `COACH` and `STUDENT`; coach-only tournament administration is protected by `RolesGuard`. |
| API | URI versioning under `/api/v1`, strict `class-validator` DTOs, and a `{ success, statusCode, data, timestamp }` success envelope. |
| Database | PostgreSQL through `postgres.js` and Drizzle ORM. Current tables are `users`, `tournaments`, `tournament_participants`, and `matches`. |
| Game state | The server owns the authoritative `chess.js` state, validates turns and moves, calculates clocks, persists match state, and broadcasts updates through Socket.IO. |
| Matchmaking | FIFO queues and an active-player registry are currently in memory. The service also checks PostgreSQL for unresolved `IN_PROGRESS` matches to reduce double-booking. |
| Clock | Each match stores remaining white/black milliseconds; the server measures elapsed time from the current turn and schedules timeout handling. |
| Scoring | Win = 1.0, draw = 0.5, loss = 0.0. Scores are stored as integer millipoints. Current ordering is score → Buchholz → wins. |
| Live sync | Socket.IO handles pairing, moves, draw offers, resignation, match completion, and leaderboard update notifications. React Query refetches server data after relevant events. |
| Local orchestration | Docker Compose exposes PostgreSQL on `5432`, the backend on `3001`, and the frontend on `3000`. Production secrets must not use the values committed in the Compose example. |

---

## Phase 0 — Repository and setup

- [x] Separate NestJS backend and Next.js frontend applications.
- [x] Backend package scripts for start, build, migration, seed, lint, unit tests, coverage, and e2e tests.
- [x] Frontend package scripts for development, production build, production start, and lint.
- [x] Dockerfiles for backend and frontend.
- [x] `docker-compose.yml` with PostgreSQL, backend, and frontend services.
- [ ] Add an explicit Compose migration/seed job; the current containers start the applications but do not automatically run `db:migrate` or `db:seed`.
- [x] Root and backend environment templates.
- [x] README quick-start, local two-browser flow, architecture notes, and API reference.
- [ ] Add a dedicated `frontend/.env.example` so both applications have local templates.
- [ ] Add a root command or workspace script to install, build, and test both applications consistently.

## Phase 1 — Data model and authentication

### Database

- [x] Drizzle schema for users, tournaments, tournament participants, and matches.
- [x] PostgreSQL enums for user role, tournament status, match status/result, and termination reason.
- [x] Foreign keys and unique tournament/user participation index.
- [x] Match persistence for FEN, PGN, result, termination reason, clocks, start time, and end time.
- [x] Drizzle migration files and `npm run db:migrate`.
- [x] Seed data for one coach, four students, and one open tournament.
- [x] Document that `npm run db:seed` deletes existing matches, participants, tournaments, and users before reseeding.
- [ ] Make seeding explicitly idempotent or add a separate non-destructive demo-data command.

### API and security

- [x] `POST /api/v1/auth/login`.
- [x] `POST /api/v1/auth/register`.
- [x] `POST /api/v1/auth/logout`.
- [x] `GET /api/v1/auth/me`.
- [x] `bcryptjs` password hashing with 10 rounds.
- [x] JWT authentication through cookie, Bearer token, and Socket.IO handshake token.
- [x] `JwtAuthGuard`, `RolesGuard`, and `CurrentUser` decorator.
- [x] Strict validation with `whitelist`, `forbidNonWhitelisted`, and transformation enabled.
- [ ] Restrict public registration from choosing the `COACH` role; coach accounts should be provisioned by an administrator or seed process.
- [ ] Remove the fallback JWT secret from application code and fail fast when a production secret is missing.
- [ ] Add authentication and authorization tests for every protected HTTP and Socket.IO path.

## Phase 2 — Tournament management

### Implemented API

- [x] `GET /api/v1/tournaments`.
- [x] `GET /api/v1/tournaments/:id` with participant details.
- [x] Coach `POST /api/v1/tournaments`.
- [x] Coach `PATCH /api/v1/tournaments/:id`.
- [x] Coach `DELETE /api/v1/tournaments/:id`.
- [x] Student `POST /api/v1/tournaments/:id/join`.
- [x] Coach `POST /api/v1/tournaments/:id/add-student`.
- [x] `GET /api/v1/tournaments/:id/leaderboard`.
- [x] `GET /api/v1/tournaments/:id/matches`.
- [x] Time-control parsing for formats such as `5+0`, `3+2`, and `10+5`.
- [x] Students cannot join draft or completed tournaments.
- [ ] Add a participant leave endpoint; currently queue cancellation is supported, but tournament registration is not removable through the API.
- [ ] Add explicit lifecycle transition rules instead of allowing every status value through the generic update endpoint.
- [ ] Add pagination/filtering for large tournament and match lists.

## Phase 3 — Matchmaking

- [x] Authenticated Socket.IO gateway.
- [x] Per-user Socket.IO rooms for pairing notifications.
- [x] `queue:join` validates tournament status and participant membership.
- [x] `queue:leave` removes a player from a queue.
- [x] FIFO pairing when at least two players are waiting.
- [x] Random white/black assignment.
- [x] Tournament time control copied into the new match.
- [x] Match record created with `IN_PROGRESS` status.
- [x] `OPEN` tournament automatically transitions to `ONGOING` after the first match is created.
- [x] Active players released after a match ends or a player leaves the queue.
- [x] Re-queue support after a match ends.
- [ ] Replace the in-memory queue with a durable queue or a distributed locking strategy before running multiple backend replicas.
- [ ] Recover queued players and active-player state after a backend restart.
- [ ] Add concurrency tests for simultaneous queue joins and duplicate pairing attempts.

## Phase 4 — Live match loop

### Server-authoritative game

- [x] Server-side `chess.js` instance for each active match.
- [x] `match:join` returns the current FEN, PGN, turn, clocks, status, and spectator state.
- [x] Participant checks for move submission.
- [x] Legal move and turn validation on the server.
- [x] Server-side clock deduction and increment handling.
- [x] Automated timeout handling with a server timer.
- [x] Persisted move state in the `matches` row for refresh/reconnect recovery.
- [x] Game endings for checkmate, timeout, resignation, stalemate, insufficient material, repetition/draw detection, and draw agreement where supported by the engine.
- [x] PGN generation and final FEN persistence.
- [x] Draw offer, accept/decline, and resignation flows.
- [x] `match:ended` broadcast to the match room.
- [x] Coaches can spectate an ongoing match through `match:join`.
- [ ] Add a dedicated move-history table if auditability or replay storage beyond PGN is required.
- [ ] Verify timeout and active-match recovery after a process restart with an automated integration test.

### Frontend match experience

- [x] Chess board with orientation based on player color.
- [x] Move submission through Socket.IO.
- [x] Live clocks, move list, captures, check/checkmate states, and PGN display.
- [x] Draw-offer modal and resignation flow.
- [x] Game-over result dialog with confetti and sound effects.
- [x] Move-list review navigation.
- [x] Reconnection support and match snapshot reload.
- [x] “Find Next Opponent” re-queue flow.
- [ ] Add a visible server time/synchronization indicator for clock diagnostics.

## Phase 5 — Leaderboard and statistics

- [x] Win/draw/loss scoring.
- [x] Millipoint storage to avoid floating-point persistence errors.
- [x] Buchholz calculation from opponents’ tournament scores.
- [x] Wins as the final current tie-breaker.
- [x] Standings persisted to `tournament_participants` after match completion.
- [x] `leaderboard:updated` broadcast after completed matches.
- [x] Tournament detail page displays live standings.
- [x] Match history page displays the user’s games and results.
- [ ] Define and implement a final tie policy for equal score, Buchholz, and wins.
- [ ] Add richer statistics such as win rate, average game length, and total time used.
- [ ] Add an explicit tournament winner/completion workflow with validation that no live matches remain.

## Phase 6 — Frontend experience

- [x] Login page with seeded account quick switcher.
- [x] Auth context with login, logout, session refresh, and Socket.IO connection setup.
- [x] Tournament list, tournament detail, leaderboard, and match list pages.
- [x] Coach and student role-aware navigation.
- [x] React Query caching and mutation invalidation.
- [x] Loading, error, empty, confirmation, and game-over UI states.
- [x] Responsive chess match layout with warm wood and academy slate styling.
- [x] Procedural Web Audio sound effects with no external audio assets.
- [ ] Add automated browser coverage for login, two-browser matchmaking, reconnect, and leaderboard refresh.
- [ ] Add a clear offline/backend-unavailable recovery screen for initial login and tournament loading.

## Phase 7 — Testing and documentation

### Existing verification surface

- [x] Vitest unit tests for leaderboard scoring and Buchholz.
- [x] Vitest unit tests for tournament join rules and time-control parsing.
- [x] Vitest tests for chess legality, checkmate, and stalemate.
- [x] Backend e2e test configuration and test entry point.
- [x] Backend commands documented: `test`, `test:e2e`, `test:cov`, `lint`, and `build`.
- [x] README documents setup, credentials, database behavior, REST API, Socket.IO events, and key trade-offs.
- [x] This roadmap documents current implementation and remaining work.

### Remaining quality work

- [ ] Run and record a clean-clone verification: install dependencies, migrate, seed, run tests, lint, and build both applications.
- [ ] Add CI for backend tests/lint/build and frontend lint/build.
- [ ] Add integration coverage for database migrations and match persistence.
- [ ] Add security tests for role escalation, unauthorized match access, and malformed Socket.IO payloads.
- [ ] Add API examples or an OpenAPI/Swagger document.
- [ ] Add structured logging and health/readiness checks that include database connectivity.

## Phase 8 — Production hardening

- [ ] Remove hardcoded development secrets from Compose and source fallbacks.
- [ ] Add a production deployment guide for frontend, backend, PostgreSQL, CORS, cookies, and environment variables.
- [ ] Decide whether production will run one backend instance or use a shared queue/lock store for horizontal scaling.
- [ ] Make database migrations run as an explicit release step before application startup.
- [ ] Add backup/restore and migration rollback guidance.
- [ ] Add rate limiting for login, registration, and Socket.IO actions.
- [ ] Restrict `GET /api/v1/matches/:id` to participants and authorized coaches; the Socket.IO path already performs a participant/coach check.
- [ ] Add monitoring for active matches, queue length, timeout processing, database failures, and websocket disconnects.

---

## REST API checklist

| Method | Path | Access | Current purpose |
|---|---|---|---|
| `GET` | `/` | Public | Backend health response. |
| `POST` | `/api/v1/auth/login` | Public | Login and issue JWT. |
| `POST` | `/api/v1/auth/register` | Public | Register a user. |
| `POST` | `/api/v1/auth/logout` | Public | Clear the auth cookie. |
| `GET` | `/api/v1/auth/me` | Authenticated | Get the current user. |
| `GET` | `/api/v1/tournaments` | Authenticated | List tournaments. |
| `GET` | `/api/v1/tournaments/:id` | Authenticated | Get tournament and participants. |
| `POST` | `/api/v1/tournaments` | Coach | Create a tournament. |
| `PATCH` | `/api/v1/tournaments/:id` | Coach | Update a tournament. |
| `DELETE` | `/api/v1/tournaments/:id` | Coach | Delete a tournament. |
| `POST` | `/api/v1/tournaments/:id/join` | Student | Join a tournament. |
| `POST` | `/api/v1/tournaments/:id/add-student` | Coach | Add a student. |
| `GET` | `/api/v1/tournaments/:id/leaderboard` | Authenticated | Read standings. |
| `GET` | `/api/v1/tournaments/:id/matches` | Authenticated | List tournament matches. |
| `GET` | `/api/v1/matches/my-history` | Authenticated | Read the current user’s matches. |
| `GET` | `/api/v1/matches/:id` | Authenticated | Read match details. |

## Socket.IO event checklist

| Event | Direction | Payload / result |
|---|---|---|
| `queue:join` | Client → server | `{ tournamentId }`; returns queue state or an error. |
| `queue:leave` | Client → server | `{ tournamentId? }`; removes the player from matchmaking. |
| `match:paired` | Server → client | Match ID, tournament ID, color, players, and initial clock. |
| `match:started` | Server → tournament room | Match ID and both players. |
| `match:join` | Client → server | `{ matchId }`; returns a current match snapshot. |
| `match:move` | Client → server | `{ matchId, from, to, promotion? }`. |
| `match:move_applied` | Server → match room | Move, FEN, PGN, turn, and both clocks. |
| `match:resign` | Client → server | `{ matchId }`. |
| `match:offer_draw` | Client → server | `{ matchId }`. |
| `match:draw_offered` | Server → opponent | Match ID and proposing user details. |
| `match:respond_draw` | Client → server | `{ matchId, accept }`. |
| `match:draw_declined` | Server → match room | Match ID. |
| `match:ended` | Server → match room | Result, reason, PGN, final FEN, and winner where applicable. |
| `leaderboard:updated` | Server → tournament room | Tournament ID and refreshed standings. |

## Seed credentials

| Role | Email | Password |
|---|---|---|
| Coach | `coach@kingdom.chess` | `CoachPass123!` |
| Student 1 | `student1@kingdom.chess` | `StudentPass123!` |
| Student 2 | `student2@kingdom.chess` | `StudentPass123!` |
| Student 3 | `student3@kingdom.chess` | `StudentPass123!` |
| Student 4 | `student4@kingdom.chess` | `StudentPass123!` |

## Recommended next milestone

Before production or multi-instance deployment, complete the security and
reliability items first: remove default secrets, prevent public coach
registration, enforce match-detail authorization, make matchmaking durable or
single-instance explicit, and add clean-clone/CI verification.
