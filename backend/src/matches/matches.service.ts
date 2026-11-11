import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, or, desc } from 'drizzle-orm';
import { DbService } from '../db/db.service.js';
import * as schema from '../db/schema.js';

@Injectable()
export class MatchesService {
  constructor(private readonly dbService: DbService) {}

  async findOne(id: string) {
    const [match] = await this.dbService.db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.id, id))
      .limit(1);

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    const [whiteUser] = await this.dbService.db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, match.whitePlayerId))
      .limit(1);

    const [blackUser] = await this.dbService.db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, match.blackPlayerId))
      .limit(1);

    const moves = await this.dbService.db
      .select()
      .from(schema.matchMoves)
      .where(eq(schema.matchMoves.matchId, id))
      .orderBy(schema.matchMoves.moveNumber);

    return {
      ...match,
      whitePlayer: whiteUser,
      blackPlayer: blackUser,
      moves,
    };
  }

  async findUserMatches(userId: string) {
    const userMatches = await this.dbService.db
      .select()
      .from(schema.matches)
      .where(
        or(
          eq(schema.matches.whitePlayerId, userId),
          eq(schema.matches.blackPlayerId, userId),
        ),
      )
      .orderBy(desc(schema.matches.startedAt));

    const enriched = [];
    for (const m of userMatches) {
      const [whiteUser] = await this.dbService.db
        .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, m.whitePlayerId))
        .limit(1);

      const [blackUser] = await this.dbService.db
        .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, m.blackPlayerId))
        .limit(1);

      const [tournament] = await this.dbService.db
        .select({ id: schema.tournaments.id, name: schema.tournaments.name })
        .from(schema.tournaments)
        .where(eq(schema.tournaments.id, m.tournamentId))
        .limit(1);

      enriched.push({
        ...m,
        whitePlayer: whiteUser,
        blackPlayer: blackUser,
        tournament,
      });
    }

    return enriched;
  }
}

