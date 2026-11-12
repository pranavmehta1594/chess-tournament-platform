# Kingdom of Chess - How to Play

This guide explains the normal user flow after the project is running. For
installation and environment setup, see [SETUP.md](SETUP.md).

## Roles

### Coach

A coach can:

- Create and manage tournaments
- Choose the time control and tournament status
- View participants, matches, and the live leaderboard
- Spectate live games
- End a tournament

### Student

A student can:

- Join an open tournament
- Enter the matchmaking queue
- Play live chess against another student
- Offer a draw or resign
- View tournament standings and match history

## Quick demo flow

### 1. Start the project

Make sure both services are running:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:3001
```

Open the frontend in a browser and log in with one of the seeded accounts.

### 2. Create a tournament as a coach

1. Log in as `coach@kingdom.chess`.
2. Open **Tournaments**.
3. Click **Create Tournament**.
4. Enter a tournament name.
5. Select a time control, such as `5+0` or `3+2`.
6. Keep the initial status as **OPEN**.
7. Click **Create Tournament**.

Students can only join tournaments that are open. A draft tournament is hidden
from student matchmaking.

### 3. Join as a student

Use a different browser profile, Incognito window, or another device:

1. Log in as a student, for example `student1@kingdom.chess`.
2. Open **Tournaments**.
3. Select the tournament and click **Enter Arena**.
4. Click **Join Tournament**.
5. After joining, click **Find Opponent**.

The student will see a **Searching** status while waiting for another student.
Click **Cancel** if matchmaking should stop.

### 4. Match two students

To test a complete game, use two separate browser sessions:

| Browser | Account |
| --- | --- |
| Browser 1 | `student1@kingdom.chess` |
| Browser 2 | `student2@kingdom.chess` |

In both sessions:

1. Log in.
2. Open the same open tournament.
3. Join the tournament.
4. Click **Find Opponent**.

When both students are searching, the server automatically pairs them. Both
players are redirected to the live match arena without refreshing the page.

## Playing the game

During a match:

- Move pieces by clicking or dragging them to legal squares.
- The server validates every move.
- The active player's clock counts down.
- The opponent's board updates in real time.
- The move list and PGN update after every move.
- The player colors are assigned automatically as White or Black.

The game can finish by:

- Checkmate
- Timeout
- Resignation
- An accepted draw offer
- Stalemate or another chess draw condition

Use the match controls to offer a draw or resign. A result dialog appears when
the game ends.

## After a match

When the game ends, you can:

- Return to the tournament
- Choose **Find Next Opponent** when available
- Open **Live Leaderboard** to see updated scores
- Open the tournament's **Matches** tab to review completed games
- Open **My Matches** from the navigation bar to view personal match history

Scoring is:

| Result | Score |
| --- | --- |
| Win | 1 point |
| Draw | 0.5 points |
| Loss | 0 points |

## Recommended evaluation checklist

Use this checklist to verify the main features:

- [ ] Coach can log in.
- [ ] Coach can create an open tournament.
- [ ] Student 1 can join the tournament.
- [ ] Student 2 can join the tournament.
- [ ] Both students can enter matchmaking.
- [ ] The server pairs both students automatically.
- [ ] A move appears on both boards.
- [ ] Clocks update for the correct player.
- [ ] A draw offer can be accepted or declined.
- [ ] A player can resign.
- [ ] The leaderboard updates after the match.
- [ ] The match appears in **My Matches**.

## Important testing notes

- Use two separate browser sessions. One browser session cannot represent two
  logged-in users at the same time.
- Both students must join the same tournament before searching.
- The tournament must be **OPEN** or **ONGOING**.
- If a student is stuck on **Searching**, check that the backend and Socket.IO
  connection are running and that the second student is also searching.
- On a phone, do not configure the API as `localhost`; use the computer's LAN
  IP address as described in [SETUP.md](SETUP.md).
