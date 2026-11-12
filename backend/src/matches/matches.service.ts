import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, or, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DbService } from '../db/db.service.js';
import * as schema from '../db/schema.js';

@Injectable()
export class MatchesService {
  constructor(private readonly dbService: DbService) {}

  async findOne(id: string) {
    const whitePlayer = alias(schema.users, 'match_detail_white_player');
    const blackPlayer = alias(schema.users, 'match_detail_black_player');

    const [match] = await this.dbService.db
      .select({
        id: schema.matches.id,
        tournamentId: schema.matches.tournamentId,
        whitePlayerId: schema.matches.whitePlayerId,
        blackPlayerId: schema.matches.blackPlayerId,
        status: schema.matches.status,
        result: schema.matches.result,
        terminationReason: schema.matches.terminationReason,
        pgn: schema.matches.pgn,
        finalFen: schema.matches.finalFen,
        whiteTimeRemainingMs: schema.matches.whiteTimeRemainingMs,
        blackTimeRemainingMs: schema.matches.blackTimeRemainingMs,
        whitePlayer: {
          name: whitePlayer.name,
        },
        blackPlayer: {
          name: blackPlayer.name,
        },
        tournament: {
          name: schema.tournaments.name,
          timeControl: schema.tournaments.timeControl,
        },
      })
      .from(schema.matches)
      .innerJoin(whitePlayer, eq(schema.matches.whitePlayerId, whitePlayer.id))
      .innerJoin(blackPlayer, eq(schema.matches.blackPlayerId, blackPlayer.id))
      .innerJoin(schema.tournaments, eq(schema.matches.tournamentId, schema.tournaments.id))
      .where(eq(schema.matches.id, id))
      .limit(1);

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return match;
  }

  async findUserMatches(userId: string) {
    const activeMatches = await this.dbService.db
      .select({
        id: schema.matches.id,
        status: schema.matches.status,
        whitePlayerId: schema.matches.whitePlayerId,
        blackPlayerId: schema.matches.blackPlayerId,
        whiteTimeRemainingMs: schema.matches.whiteTimeRemainingMs,
        blackTimeRemainingMs: schema.matches.blackTimeRemainingMs,
        startedAt: schema.matches.startedAt,
      })
      .from(schema.matches)
      .where(
        or(
          eq(schema.matches.whitePlayerId, userId),
          eq(schema.matches.blackPlayerId, userId),
        ),
      )
      .orderBy(desc(schema.matches.startedAt));

    for (const m of activeMatches) {
      // Auto-finalize any stale match whose clock has elapsed
      if (m.status === 'IN_PROGRESS') {
        const totalMaxMs = (m.whiteTimeRemainingMs || 300000) + (m.blackTimeRemainingMs || 300000);
        const elapsedSinceStart = Date.now() - new Date(m.startedAt).getTime();
        if (elapsedSinceStart > totalMaxMs + 5000 || m.whiteTimeRemainingMs === 0 || m.blackTimeRemainingMs === 0) {
          const result = m.whiteTimeRemainingMs === 0 ? 'BLACK_WIN' : 'WHITE_WIN';
          await this.dbService.db
            .update(schema.matches)
            .set({
              status: 'COMPLETED',
              result,
              terminationReason: 'TIMEOUT',
              endedAt: new Date(),
            })
            .where(eq(schema.matches.id, m.id));

        }
      }
    }

    const whitePlayer = alias(schema.users, 'history_white_player');
    const blackPlayer = alias(schema.users, 'history_black_player');

    const userMatches = await this.dbService.db
      .select({
        id: schema.matches.id,
        whitePlayerId: schema.matches.whitePlayerId,
        blackPlayerId: schema.matches.blackPlayerId,
        status: schema.matches.status,
        result: schema.matches.result,
        terminationReason: schema.matches.terminationReason,
        startedAt: schema.matches.startedAt,
        endedAt: schema.matches.endedAt,
        whiteTimeRemainingMs: schema.matches.whiteTimeRemainingMs,
        blackTimeRemainingMs: schema.matches.blackTimeRemainingMs,
        whitePlayer: {
          name: whitePlayer.name,
        },
        blackPlayer: {
          name: blackPlayer.name,
        },
        tournament: {
          name: schema.tournaments.name,
        },
      })
      .from(schema.matches)
      .innerJoin(whitePlayer, eq(schema.matches.whitePlayerId, whitePlayer.id))
      .innerJoin(blackPlayer, eq(schema.matches.blackPlayerId, blackPlayer.id))
      .innerJoin(schema.tournaments, eq(schema.matches.tournamentId, schema.tournaments.id))
      .where(
        or(
          eq(schema.matches.whitePlayerId, userId),
          eq(schema.matches.blackPlayerId, userId),
        ),
      )
      .orderBy(desc(schema.matches.startedAt));

    return userMatches;
  }
}

