import { describe, it, expect } from 'vitest';
import { LeaderboardService } from './leaderboard.service.js';

describe('LeaderboardService (Deterministic Logic)', () => {
  const dummyDbService: any = { db: {} };
  const service = new LeaderboardService(dummyDbService);

  const participants = [
    { userId: 'u1', name: 'Player 1', email: 'p1@test.com' },
    { userId: 'u2', name: 'Player 2', email: 'p2@test.com' },
    { userId: 'u3', name: 'Player 3', email: 'p3@test.com' },
  ];

  it('correctly scores win (1.0), draw (0.5), and loss (0.0)', () => {
    const matches = [
      { whitePlayerId: 'u1', blackPlayerId: 'u2', result: 'WHITE_WIN' as const },
      { whitePlayerId: 'u2', blackPlayerId: 'u3', result: 'DRAW' as const },
    ];

    const standings = service.calculateStandings(participants, matches);

    // Player 1: 1 win = 1.0 pt
    const p1 = standings.find((s) => s.userId === 'u1')!;
    expect(p1.score).toBe(1);
    expect(p1.wins).toBe(1);
    expect(p1.losses).toBe(0);

    // Player 2: 1 loss + 1 draw = 0.5 pt
    const p2 = standings.find((s) => s.userId === 'u2')!;
    expect(p2.score).toBe(0.5);
    expect(p2.draws).toBe(1);
    expect(p2.losses).toBe(1);

    // Player 3: 1 draw = 0.5 pt
    const p3 = standings.find((s) => s.userId === 'u3')!;
    expect(p3.score).toBe(0.5);
    expect(p3.draws).toBe(1);
  });

  it('correctly applies Buchholz tiebreaking when points are tied', () => {
    // Both u2 and u3 have 0.5 points.
    // u2 played u1 (1.0 pt) and u3 (0.5 pt) -> Buchholz = 1000 + 500 = 1500
    // u3 played u2 (0.5 pt) -> Buchholz = 500
    // Therefore, u2 should rank higher than u3!
    const matches = [
      { whitePlayerId: 'u1', blackPlayerId: 'u2', result: 'WHITE_WIN' as const },
      { whitePlayerId: 'u2', blackPlayerId: 'u3', result: 'DRAW' as const },
    ];

    const standings = service.calculateStandings(participants, matches);

    expect(standings[0].userId).toBe('u1'); // 1.0 pt
    expect(standings[1].userId).toBe('u2'); // 0.5 pt, Buchholz 1500
    expect(standings[2].userId).toBe('u3'); // 0.5 pt, Buchholz 500

    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(2);
    expect(standings[2].rank).toBe(3);
  });
});
