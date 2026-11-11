import { Injectable, Logger } from '@nestjs/common';
import { Chess } from 'chess.js';
import { eq } from 'drizzle-orm';
import { DbService } from '../db/db.service.js';
import * as schema from '../db/schema.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';

export interface ActiveMatchState {
  matchId: string;
  tournamentId: string;
  whitePlayerId: string;
  blackPlayerId: string;
  chess: InstanceType<typeof Chess>;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  incrementMs: number;
  lastTurnStartTime: number;
  turn: 'w' | 'b';
  status: 'IN_PROGRESS' | 'COMPLETED';
  timeoutTimer?: NodeJS.Timeout;
  drawOfferFrom?: string | null;
}

export type MoveResult =
  | {
      success: true;
      move: any;
      fen: string;
      pgn: string;
      turn: 'w' | 'b';
      whiteTimeRemainingMs: number;
      blackTimeRemainingMs: number;
      isGameOver: boolean;
      result?: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW';
      reason?: 'CHECKMATE' | 'TIMEOUT' | 'RESIGNATION' | 'STALEMATE' | 'INSUFFICIENT_MATERIAL' | 'AGREEMENT';
      winnerId?: string;
    }
  | {
      success: false;
      error: string;
    };

@Injectable()
export class GameEngineService {
  private readonly logger = new Logger(GameEngineService.name);
  private activeMatches = new Map<string, ActiveMatchState>();

  // Callback registered by GameGateway to notify clients on automated events (e.g. timeout)
  public onGameEnded?: (
    matchId: string,
    data: {
      result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW';
      reason: 'CHECKMATE' | 'TIMEOUT' | 'RESIGNATION' | 'STALEMATE' | 'INSUFFICIENT_MATERIAL' | 'AGREEMENT';
      winnerId?: string;
      pgn: string;
      finalFen: string;
      whiteTimeRemainingMs: number;
      blackTimeRemainingMs: number;
    },
  ) => void;

  constructor(
    private readonly dbService: DbService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  /**
   * Initializes or restores an active match into memory
   */
  async getOrLoadMatch(matchId: string): Promise<ActiveMatchState | null> {
    if (this.activeMatches.has(matchId)) {
      return this.activeMatches.get(matchId)!;
    }

    const [dbMatch] = await this.dbService.db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.id, matchId))
      .limit(1);

    if (!dbMatch || dbMatch.status === 'COMPLETED') {
      return null;
    }

    const [tournament] = await this.dbService.db
      .select({ incrementSeconds: schema.tournaments.incrementSeconds })
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, dbMatch.tournamentId))
      .limit(1);

    const chess = new Chess();
    if (dbMatch.pgn) {
      try {
        chess.loadPgn(dbMatch.pgn);
      } catch {
        if (dbMatch.finalFen) {
          try {
            chess.load(dbMatch.finalFen);
          } catch {
            chess.reset();
          }
        }
      }
    } else if (dbMatch.finalFen) {
      try {
        chess.load(dbMatch.finalFen);
      } catch {
        chess.reset();
      }
    }

    const state: ActiveMatchState = {
      matchId: dbMatch.id,
      tournamentId: dbMatch.tournamentId,
      whitePlayerId: dbMatch.whitePlayerId,
      blackPlayerId: dbMatch.blackPlayerId,
      chess,
      whiteTimeRemainingMs: dbMatch.whiteTimeRemainingMs,
      blackTimeRemainingMs: dbMatch.blackTimeRemainingMs,
      incrementMs: (tournament?.incrementSeconds ?? 0) * 1000,
      lastTurnStartTime: Date.now(),
      turn: chess.turn() as 'w' | 'b',
      status: 'IN_PROGRESS',
    };

    this.activeMatches.set(matchId, state);
    this.scheduleTimeout(state);
    return state;
  }

  /**
   * Initializes a brand new match immediately after matchmaking pairing
   */
  initMatch(
    matchId: string,
    tournamentId: string,
    whitePlayerId: string,
    blackPlayerId: string,
    initialTimeMs: number,
    incrementMs: number,
  ): ActiveMatchState {
    const chess = new Chess();
    const state: ActiveMatchState = {
      matchId,
      tournamentId,
      whitePlayerId,
      blackPlayerId,
      chess,
      whiteTimeRemainingMs: initialTimeMs,
      blackTimeRemainingMs: initialTimeMs,
      incrementMs,
      lastTurnStartTime: Date.now(),
      turn: 'w',
      status: 'IN_PROGRESS',
    };

    this.activeMatches.set(matchId, state);
    this.scheduleTimeout(state);
    return state;
  }

  /**
   * Computes accurate current clocks factoring elapsed monotonic time
   */
  getCurrentClocks(state: ActiveMatchState): { whiteMs: number; blackMs: number } {
    if (state.status === 'COMPLETED') {
      return {
        whiteMs: Math.max(0, state.whiteTimeRemainingMs),
        blackMs: Math.max(0, state.blackTimeRemainingMs),
      };
    }

    const elapsed = Date.now() - state.lastTurnStartTime;
    if (state.turn === 'w') {
      return {
        whiteMs: Math.max(0, state.whiteTimeRemainingMs - elapsed),
        blackMs: state.blackTimeRemainingMs,
      };
    } else {
      return {
        whiteMs: state.whiteTimeRemainingMs,
        blackMs: Math.max(0, state.blackTimeRemainingMs - elapsed),
      };
    }
  }

  /**
   * Validates and applies a move server-side
   */
  async makeMove(
    matchId: string,
    playerId: string,
    moveInput: { from: string; to: string; promotion?: string },
  ): Promise<MoveResult> {
    const state = await this.getOrLoadMatch(matchId);
    if (!state) {
      return { success: false, error: 'Match is not active' };
    }

    if (state.status !== 'IN_PROGRESS') {
      return { success: false, error: 'Match has ended' };
    }

    // Verify turn ownership
    const expectedPlayerId = state.turn === 'w' ? state.whitePlayerId : state.blackPlayerId;
    if (playerId !== expectedPlayerId) {
      return {
        success: false,
        error: `It is not your turn (Waiting for ${state.turn === 'w' ? 'White' : 'Black'})`,
      };
    }

    // Calculate elapsed time and update clock
    const now = Date.now();
    const elapsed = now - state.lastTurnStartTime;

    if (state.turn === 'w') {
      state.whiteTimeRemainingMs = Math.max(0, state.whiteTimeRemainingMs - elapsed + state.incrementMs);
      if (state.whiteTimeRemainingMs <= 0) {
        return this.handleTimeout(state, 'w');
      }
    } else {
      state.blackTimeRemainingMs = Math.max(0, state.blackTimeRemainingMs - elapsed + state.incrementMs);
      if (state.blackTimeRemainingMs <= 0) {
        return this.handleTimeout(state, 'b');
      }
    }

    // Validate and apply move with chess.js
    let moveObj: any;
    try {
      moveObj = state.chess.move({
        from: moveInput.from,
        to: moveInput.to,
        promotion: moveInput.promotion || 'q',
      });
    } catch {
      return { success: false, error: 'Illegal chess move' };
    }

    if (!moveObj) {
      return { success: false, error: 'Illegal chess move' };
    }

    // Move is valid! Update turn and monotonic timer
    state.turn = state.chess.turn() as 'w' | 'b';
    state.lastTurnStartTime = now;
    state.drawOfferFrom = null; // Clear any pending draw offer on move

    // Record move in DB
    const moveCount = state.chess.history().length;
    await this.dbService.db.insert(schema.matchMoves).values({
      matchId: state.matchId,
      moveNumber: moveCount,
      color: moveObj.color,
      san: moveObj.san,
      uci: `${moveObj.from}${moveObj.to}${moveObj.promotion || ''}`,
      fenAfter: state.chess.fen(),
      timeSpentMs: elapsed,
    });

    // Persist current board state, PGN, and clocks into matches table
    await this.dbService.db
      .update(schema.matches)
      .set({
        finalFen: state.chess.fen(),
        pgn: state.chess.pgn(),
        whiteTimeRemainingMs: state.whiteTimeRemainingMs,
        blackTimeRemainingMs: state.blackTimeRemainingMs,
      })
      .where(eq(schema.matches.id, state.matchId));

    // Check game termination conditions
    if (state.chess.isCheckmate()) {
      const winnerColor = state.turn === 'w' ? 'b' : 'w';
      const result = winnerColor === 'w' ? 'WHITE_WIN' : 'BLACK_WIN';
      const winnerId = winnerColor === 'w' ? state.whitePlayerId : state.blackPlayerId;
      await this.finalizeMatch(state, result, 'CHECKMATE', winnerId);

      return {
        success: true,
        move: moveObj,
        fen: state.chess.fen(),
        pgn: state.chess.pgn(),
        turn: state.turn,
        whiteTimeRemainingMs: state.whiteTimeRemainingMs,
        blackTimeRemainingMs: state.blackTimeRemainingMs,
        isGameOver: true,
        result,
        reason: 'CHECKMATE',
        winnerId,
      };
    }

    if (
      state.chess.isDraw() ||
      state.chess.isStalemate() ||
      state.chess.isInsufficientMaterial() ||
      state.chess.isThreefoldRepetition()
    ) {
      const reason = state.chess.isStalemate()
        ? 'STALEMATE'
        : state.chess.isInsufficientMaterial()
          ? 'INSUFFICIENT_MATERIAL'
          : 'AGREEMENT';

      await this.finalizeMatch(state, 'DRAW', reason);

      return {
        success: true,
        move: moveObj,
        fen: state.chess.fen(),
        pgn: state.chess.pgn(),
        turn: state.turn,
        whiteTimeRemainingMs: state.whiteTimeRemainingMs,
        blackTimeRemainingMs: state.blackTimeRemainingMs,
        isGameOver: true,
        result: 'DRAW',
        reason,
      };
    }

    // Reschedule next turn timeout
    this.scheduleTimeout(state);

    return {
      success: true,
      move: moveObj,
      fen: state.chess.fen(),
      pgn: state.chess.pgn(),
      turn: state.turn,
      whiteTimeRemainingMs: state.whiteTimeRemainingMs,
      blackTimeRemainingMs: state.blackTimeRemainingMs,
      isGameOver: false,
    };
  }

  /**
   * Resignation handler
   */
  async resign(matchId: string, playerId: string) {
    const state = await this.getOrLoadMatch(matchId);
    if (!state || state.status !== 'IN_PROGRESS') {
      throw new Error('Match is not active');
    }

    const isWhite = playerId === state.whitePlayerId;
    const isBlack = playerId === state.blackPlayerId;
    if (!isWhite && !isBlack) {
      throw new Error('Player is not in this match');
    }

    const result = isWhite ? 'BLACK_WIN' : 'WHITE_WIN';
    const winnerId = isWhite ? state.blackPlayerId : state.whitePlayerId;

    await this.finalizeMatch(state, result, 'RESIGNATION', winnerId);
    return {
      result,
      reason: 'RESIGNATION' as const,
      winnerId,
      pgn: state.chess.pgn(),
      finalFen: state.chess.fen(),
    };
  }

  /**
   * Offer Draw
   */
  async offerDraw(matchId: string, playerId: string) {
    const state = await this.getOrLoadMatch(matchId);
    if (!state || state.status !== 'IN_PROGRESS') {
      throw new Error('Match is not active');
    }

    state.drawOfferFrom = playerId;
    const opponentId = playerId === state.whitePlayerId ? state.blackPlayerId : state.whitePlayerId;
    return { opponentId };
  }

  /**
   * Respond to Draw
   */
  async respondDraw(matchId: string, playerId: string, accept: boolean) {
    const state = await this.getOrLoadMatch(matchId);
    if (!state || state.status !== 'IN_PROGRESS') {
      throw new Error('Match is not active');
    }

    if (!state.drawOfferFrom || state.drawOfferFrom === playerId) {
      throw new Error('No pending draw offer to respond to');
    }

    if (accept) {
      await this.finalizeMatch(state, 'DRAW', 'AGREEMENT');
      return {
        accepted: true,
        result: 'DRAW' as const,
        reason: 'AGREEMENT' as const,
        pgn: state.chess.pgn(),
        finalFen: state.chess.fen(),
      };
    } else {
      state.drawOfferFrom = null;
      return { accepted: false };
    }
  }

  /**
   * Authoritative Timeout Scheduler
   */
  private scheduleTimeout(state: ActiveMatchState) {
    if (state.timeoutTimer) {
      clearTimeout(state.timeoutTimer);
    }

    const currentRemaining =
      state.turn === 'w' ? state.whiteTimeRemainingMs : state.blackTimeRemainingMs;

    state.timeoutTimer = setTimeout(() => {
      this.handleTimeout(state, state.turn);
    }, Math.max(100, currentRemaining));
  }

  /**
   * Timeout execution
   */
  private async handleTimeout(state: ActiveMatchState, flagColor: 'w' | 'b'): Promise<MoveResult> {
    if (state.status === 'COMPLETED') {
      return { success: false, error: 'Match already completed' };
    }

    if (state.timeoutTimer) {
      clearTimeout(state.timeoutTimer);
    }

    if (flagColor === 'w') {
      state.whiteTimeRemainingMs = 0;
    } else {
      state.blackTimeRemainingMs = 0;
    }

    const result = flagColor === 'w' ? 'BLACK_WIN' : 'WHITE_WIN';
    const winnerId = flagColor === 'w' ? state.blackPlayerId : state.whitePlayerId;

    await this.finalizeMatch(state, result, 'TIMEOUT', winnerId);

    if (this.onGameEnded) {
      this.onGameEnded(state.matchId, {
        result,
        reason: 'TIMEOUT',
        winnerId,
        pgn: state.chess.pgn(),
        finalFen: state.chess.fen(),
        whiteTimeRemainingMs: state.whiteTimeRemainingMs,
        blackTimeRemainingMs: state.blackTimeRemainingMs,
      });
    }

    return {
      success: true,
      move: null,
      fen: state.chess.fen(),
      pgn: state.chess.pgn(),
      turn: state.turn,
      whiteTimeRemainingMs: state.whiteTimeRemainingMs,
      blackTimeRemainingMs: state.blackTimeRemainingMs,
      isGameOver: true,
      result,
      reason: 'TIMEOUT',
      winnerId,
    };
  }

  /**
   * Finalize match: persist result, stop clocks, recalculate tournament standings
   */
  private async finalizeMatch(
    state: ActiveMatchState,
    result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW',
    reason: 'CHECKMATE' | 'TIMEOUT' | 'RESIGNATION' | 'STALEMATE' | 'INSUFFICIENT_MATERIAL' | 'AGREEMENT',
    winnerId?: string,
  ) {
    state.status = 'COMPLETED';
    if (state.timeoutTimer) {
      clearTimeout(state.timeoutTimer);
    }

    // Persist to DB
    await this.dbService.db
      .update(schema.matches)
      .set({
        status: 'COMPLETED',
        result,
        terminationReason: reason,
        pgn: state.chess.pgn(),
        finalFen: state.chess.fen(),
        whiteTimeRemainingMs: state.whiteTimeRemainingMs,
        blackTimeRemainingMs: state.blackTimeRemainingMs,
        endedAt: new Date(),
      })
      .where(eq(schema.matches.id, state.matchId));

    // Refresh tournament standings
    await this.leaderboardService.refreshTournamentStandings(state.tournamentId);

    this.logger.log(
      `Match ${state.matchId} completed. Result: ${result}, Reason: ${reason}, Winner: ${winnerId || 'Draw'}`,
    );
  }
}

