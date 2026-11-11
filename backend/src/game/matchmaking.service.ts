import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { eq, and, or } from 'drizzle-orm';
import { DbService } from '../db/db.service.js';
import * as schema from '../db/schema.js';
import { GameEngineService } from './game-engine.service.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';

export interface QueuedPlayer {
  userId: string;
  socketId: string;
  tournamentId: string;
  queuedAt: number;
}

export interface MatchPairingResult {
  matchId: string;
  tournamentId: string;
  whitePlayer: { id: string; name: string; socketId?: string };
  blackPlayer: { id: string; name: string; socketId?: string };
  initialTimeMs: number;
  incrementMs: number;
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  // Queues indexed by tournamentId
  private queues = new Map<string, QueuedPlayer[]>();

  // In-memory set of userIds currently in queue or in-progress match
  private activePlayers = new Set<string>();

  constructor(
    private readonly dbService: DbService,
    private readonly gameEngineService: GameEngineService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  /**
   * Adds a player to the tournament matchmaking queue with concurrency safety
   */
  async enqueuePlayer(
    userId: string,
    socketId: string,
    tournamentId: string,
  ): Promise<{ inQueue: boolean; queueLength: number; paired?: MatchPairingResult }> {
    // 1. Verify tournament exists and is active
    const [tournament] = await this.dbService.db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, tournamentId))
      .limit(1);

    if (!tournament) {
      throw new BadRequestException('Tournament not found');
    }

    if (tournament.status !== 'OPEN' && tournament.status !== 'ONGOING') {
      throw new BadRequestException(`Tournament is ${tournament.status.toLowerCase()}`);
    }

    // 2. Concurrency Guard: Check if player already active in memory
    if (this.activePlayers.has(userId)) {
      throw new BadRequestException('Player is already in matchmaking or an active match');
    }

    // 3. Concurrency Guard: Verify no unresolved active match in DB
    const [existingMatch] = await this.dbService.db
      .select({ id: schema.matches.id })
      .from(schema.matches)
      .where(
        and(
          eq(schema.matches.status, 'IN_PROGRESS'),
          or(
            eq(schema.matches.whitePlayerId, userId),
            eq(schema.matches.blackPlayerId, userId),
          ),
        ),
      )
      .limit(1);

    if (existingMatch) {
      this.activePlayers.add(userId);
      throw new BadRequestException('Player already has a match in progress');
    }

    // 4. Verify participant registered in tournament
    const [participant] = await this.dbService.db
      .select({ id: schema.tournamentParticipants.id })
      .from(schema.tournamentParticipants)
      .where(
        and(
          eq(schema.tournamentParticipants.tournamentId, tournamentId),
          eq(schema.tournamentParticipants.userId, userId),
        ),
      )
      .limit(1);

    if (!participant) {
      throw new BadRequestException('Must join the tournament before entering matchmaking');
    }

    // 5. Add to queue
    let queue = this.queues.get(tournamentId);
    if (!queue) {
      queue = [];
      this.queues.set(tournamentId, queue);
    }

    // Avoid duplicate queue entry
    if (queue.some((p) => p.userId === userId)) {
      return { inQueue: true, queueLength: queue.length };
    }

    queue.push({
      userId,
      socketId,
      tournamentId,
      queuedAt: Date.now(),
    });
    this.activePlayers.add(userId);

    this.logger.log(`User ${userId} entered matchmaking queue for tournament ${tournamentId} (Queue: ${queue.length})`);

    // 6. If queue has at least 2 players, attempt auto-pairing!
    if (queue.length >= 2) {
      const paired = await this.tryPairPlayers(tournamentId);
      if (paired) {
        return { inQueue: false, queueLength: queue.length, paired };
      }
    }

    return { inQueue: true, queueLength: queue.length };
  }

  /**
   * Removes player from matchmaking queue
   */
  dequeuePlayer(userId: string, tournamentId?: string): boolean {
    let removed = false;

    if (tournamentId) {
      const queue = this.queues.get(tournamentId);
      if (queue) {
        const index = queue.findIndex((p) => p.userId === userId);
        if (index !== -1) {
          queue.splice(index, 1);
          removed = true;
        }
      }
    } else {
      for (const [_, queue] of this.queues) {
        const index = queue.findIndex((p) => p.userId === userId);
        if (index !== -1) {
          queue.splice(index, 1);
          removed = true;
          break;
        }
      }
    }

    this.activePlayers.delete(userId);
    return removed;
  }

  /**
   * Automatically pairs waiting players (closest standings or FIFO)
   */
  private async tryPairPlayers(tournamentId: string): Promise<MatchPairingResult | null> {
    const queue = this.queues.get(tournamentId);
    if (!queue || queue.length < 2) return null;

    // Pop the first two players (FIFO pairing)
    const player1 = queue.shift()!;
    const player2 = queue.shift()!;

    // Randomize White and Black
    const isP1White = Math.random() < 0.5;
    const whitePlayer = isP1White ? player1 : player2;
    const blackPlayer = isP1White ? player2 : player1;

    // Fetch tournament time controls
    const [tournament] = await this.dbService.db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, tournamentId))
      .limit(1);

    const initialTimeMs = (tournament?.initialTimeSeconds ?? 300) * 1000;
    const incrementMs = (tournament?.incrementSeconds ?? 0) * 1000;

    // Fetch user profile info
    const [whiteUser] = await this.dbService.db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, whitePlayer.userId))
      .limit(1);

    const [blackUser] = await this.dbService.db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, blackPlayer.userId))
      .limit(1);

    // Create match in DB
    const [newMatch] = await this.dbService.db
      .insert(schema.matches)
      .values({
        tournamentId,
        whitePlayerId: whitePlayer.userId,
        blackPlayerId: blackPlayer.userId,
        status: 'IN_PROGRESS',
        result: 'ONGOING',
        whiteTimeRemainingMs: initialTimeMs,
        blackTimeRemainingMs: initialTimeMs,
        startedAt: new Date(),
      })
      .returning();

    // If tournament was OPEN, transition status to ONGOING
    if (tournament && tournament.status === 'OPEN') {
      await this.dbService.db
        .update(schema.tournaments)
        .set({ status: 'ONGOING', updatedAt: new Date() })
        .where(eq(schema.tournaments.id, tournamentId));
    }

    // Initialize in-memory game state
    this.gameEngineService.initMatch(
      newMatch.id,
      tournamentId,
      whitePlayer.userId,
      blackPlayer.userId,
      initialTimeMs,
      incrementMs,
    );

    this.logger.log(`Paired match ${newMatch.id}: ${whiteUser.name} (W) vs ${blackUser.name} (B)`);

    return {
      matchId: newMatch.id,
      tournamentId,
      whitePlayer: { id: whitePlayer.userId, name: whiteUser.name, socketId: whitePlayer.socketId },
      blackPlayer: { id: blackPlayer.userId, name: blackUser.name, socketId: blackPlayer.socketId },
      initialTimeMs,
      incrementMs,
    };
  }

  releasePlayer(userId: string) {
    this.activePlayers.delete(userId);
  }
}

