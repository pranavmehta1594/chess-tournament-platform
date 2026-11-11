import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DbService } from '../db/db.service.js';
import * as schema from '../db/schema.js';

export interface ParticipantScore {
  userId: string;
  name: string;
  email: string;
  score: number; // in floating points, e.g. 2.5
  scoreMillipoints: number; // 2500
  wins: number;
  draws: number;
  losses: number;
  buchholzScore: number;
  rank: number;
  opponents: string[];
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly dbService: DbService) {}

  /**
   * Pure calculation helper: deterministic calculation of leaderboard given participants and matches.
   * Can be directly unit tested without a database.
   */
  calculateStandings(
    participants: { userId: string; name: string; email: string }[],
    completedMatches: {
      whitePlayerId: string;
      blackPlayerId: string;
      result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ONGOING';
    }[],
  ): ParticipantScore[] {
    const scoresMap = new Map<string, ParticipantScore>();

    for (const p of participants) {
      scoresMap.set(p.userId, {
        userId: p.userId,
        name: p.name,
        email: p.email,
        score: 0,
        scoreMillipoints: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        buchholzScore: 0,
        rank: 1,
        opponents: [],
      });
    }

    // Process completed matches
    for (const match of completedMatches) {
      if (match.result === 'ONGOING') continue;

      const white = scoresMap.get(match.whitePlayerId);
      const black = scoresMap.get(match.blackPlayerId);

      if (white) white.opponents.push(match.blackPlayerId);
      if (black) black.opponents.push(match.whitePlayerId);

      if (match.result === 'WHITE_WIN') {
        if (white) {
          white.scoreMillipoints += 1000;
          white.wins += 1;
        }
        if (black) {
          black.losses += 1;
        }
      } else if (match.result === 'BLACK_WIN') {
        if (black) {
          black.scoreMillipoints += 1000;
          black.wins += 1;
        }
        if (white) {
          white.losses += 1;
        }
      } else if (match.result === 'DRAW') {
        if (white) {
          white.scoreMillipoints += 500;
          white.draws += 1;
        }
        if (black) {
          black.scoreMillipoints += 500;
          black.draws += 1;
        }
      }
    }

    // Compute Buchholz score: sum of raw scoreMillipoints of all opponents
    for (const [_, player] of scoresMap) {
      player.score = player.scoreMillipoints / 1000;
      let buchholz = 0;
      for (const oppId of player.opponents) {
        const opp = scoresMap.get(oppId);
        if (opp) {
          buchholz += opp.scoreMillipoints;
        }
      }
      player.buchholzScore = buchholz;
    }

    // Sort standings:
    // 1. Total score (millipoints) desc
    // 2. Buchholz score desc
    // 3. Wins count desc
    const sorted = Array.from(scoresMap.values()).sort((a, b) => {
      if (b.scoreMillipoints !== a.scoreMillipoints) {
        return b.scoreMillipoints - a.scoreMillipoints;
      }
      if (b.buchholzScore !== a.buchholzScore) {
        return b.buchholzScore - a.buchholzScore;
      }
      return b.wins - a.wins;
    });

    // Assign rank
    sorted.forEach((player, index) => {
      player.rank = index + 1;
    });

    return sorted;
  }

  /**
   * Recalculates and persists tournament standings to tournament_participants table
   */
  async refreshTournamentStandings(tournamentId: string): Promise<ParticipantScore[]> {
    // 1. Fetch participants with user info
    const participantsData = await this.dbService.db
      .select({
        userId: schema.tournamentParticipants.userId,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.tournamentParticipants)
      .innerJoin(
        schema.users,
        eq(schema.tournamentParticipants.userId, schema.users.id),
      )
      .where(eq(schema.tournamentParticipants.tournamentId, tournamentId));

    // 2. Fetch completed matches
    const matchesData = await this.dbService.db
      .select({
        whitePlayerId: schema.matches.whitePlayerId,
        blackPlayerId: schema.matches.blackPlayerId,
        result: schema.matches.result,
      })
      .from(schema.matches)
      .where(
        and(
          eq(schema.matches.tournamentId, tournamentId),
          eq(schema.matches.status, 'COMPLETED'),
        ),
      );

    const standings = this.calculateStandings(participantsData, matchesData);

    // 3. Persist updated scores into tournament_participants
    for (const item of standings) {
      await this.dbService.db
        .update(schema.tournamentParticipants)
        .set({
          scoreMillipoints: item.scoreMillipoints,
          wins: item.wins,
          draws: item.draws,
          losses: item.losses,
          buchholzScore: item.buchholzScore,
        })
        .where(
          and(
            eq(schema.tournamentParticipants.tournamentId, tournamentId),
            eq(schema.tournamentParticipants.userId, item.userId),
          ),
        );
    }

    return standings;
  }

  async getTournamentLeaderboard(tournamentId: string): Promise<ParticipantScore[]> {
    return this.refreshTournamentStandings(tournamentId);
  }
}

