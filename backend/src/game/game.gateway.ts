import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.js';
import { GameEngineService } from './game-engine.service.js';
import { MatchmakingService } from './matchmaking.service.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: AuthenticatedUser;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly gameEngineService: GameEngineService,
    private readonly matchmakingService: MatchmakingService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  afterInit() {
    this.logger.log('GameGateway initialized');

    // Register automated server callback for clock timeouts
    this.gameEngineService.onGameEnded = async (matchId, data) => {
      this.server.to(`match:${matchId}`).emit('match:ended', {
        matchId,
        ...data,
      });

      // Fetch match to get tournamentId and players
      const state = await this.gameEngineService.getOrLoadMatch(matchId);
      if (state) {
        this.matchmakingService.releasePlayer(state.whitePlayerId);
        this.matchmakingService.releasePlayer(state.blackPlayerId);

        const standings = await this.leaderboardService.getTournamentLeaderboard(state.tournamentId);
        this.server.to(`tournament:${state.tournamentId}`).emit('leaderboard:updated', {
          tournamentId: state.tournamentId,
          standings,
        });
      }
    };
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Unauthorized socket connection attempt: ${client.id}`);
        client.disconnect();
        return;
      }

      const user = await this.authService.verifyToken(token);
      client.data.user = user;

      // Join user-specific notification room
      client.join(`user:${user.id}`);
      this.logger.log(`Socket authenticated: ${client.id} (User: ${user.name} - ${user.role})`);
    } catch (err: any) {
      this.logger.warn(`Socket auth verification failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      this.matchmakingService.dequeuePlayer(user.id);
      this.logger.log(`Socket disconnected: ${client.id} (User: ${user.name})`);
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    // 1. From handshake auth token
    if (client.handshake.auth && client.handshake.auth.token) {
      return client.handshake.auth.token;
    }
    // 2. From handshake headers authorization
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    // 3. From cookies in headers
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('access_token='));
      if (match) {
        return match.split('=')[1];
      }
    }
    return null;
  }

  // ----------------------------------------------------
  // Matchmaking & Queue Handlers
  // ----------------------------------------------------

  @SubscribeMessage('queue:join')
  async handleQueueJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { tournamentId: string },
  ) {
    const user = client.data.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const result = await this.matchmakingService.enqueuePlayer(
        user.id,
        client.id,
        payload.tournamentId,
      );

      // Join tournament updates room
      client.join(`tournament:${payload.tournamentId}`);

      if (result.paired) {
        const paired = result.paired;

        // Push pairing notification to both players
        this.server.to(`user:${paired.whitePlayer.id}`).emit('match:paired', {
          matchId: paired.matchId,
          tournamentId: paired.tournamentId,
          color: 'w',
          opponent: paired.blackPlayer,
          whitePlayer: paired.whitePlayer,
          blackPlayer: paired.blackPlayer,
          initialTimeMs: paired.initialTimeMs,
        });

        this.server.to(`user:${paired.blackPlayer.id}`).emit('match:paired', {
          matchId: paired.matchId,
          tournamentId: paired.tournamentId,
          color: 'b',
          opponent: paired.whitePlayer,
          whitePlayer: paired.whitePlayer,
          blackPlayer: paired.blackPlayer,
          initialTimeMs: paired.initialTimeMs,
        });

        // Notify tournament room that a new match started
        this.server.to(`tournament:${payload.tournamentId}`).emit('match:started', {
          matchId: paired.matchId,
          whitePlayer: paired.whitePlayer,
          blackPlayer: paired.blackPlayer,
        });
      }

      return { success: true, inQueue: result.inQueue, queueLength: result.queueLength };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage('queue:leave')
  handleQueueLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { tournamentId?: string },
  ) {
    const user = client.data.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const removed = this.matchmakingService.dequeuePlayer(user.id, payload?.tournamentId);
    return { success: true, removed };
  }

  // ----------------------------------------------------
  // Live Match Interaction Handlers
  // ----------------------------------------------------

  @SubscribeMessage('match:join')
  async handleMatchJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { matchId: string },
  ) {
    const user = client.data.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const state = await this.gameEngineService.getOrLoadMatch(payload.matchId);
    if (!state) {
      return { success: false, error: 'Match not found or already completed' };
    }

    // Role-based or participant verification:
    // Only participants or coaches (spectators) can join the match room
    const isParticipant = user.id === state.whitePlayerId || user.id === state.blackPlayerId;
    const isCoach = user.role === 'COACH';

    if (!isParticipant && !isCoach) {
      return { success: false, error: 'You are not a participant in this match' };
    }

    client.join(`match:${payload.matchId}`);

    const clocks = this.gameEngineService.getCurrentClocks(state);

    return {
      success: true,
      data: {
        matchId: state.matchId,
        tournamentId: state.tournamentId,
        whitePlayerId: state.whitePlayerId,
        blackPlayerId: state.blackPlayerId,
        fen: state.chess.fen(),
        pgn: state.chess.pgn(),
        turn: state.turn,
        whiteTimeRemainingMs: clocks.whiteMs,
        blackTimeRemainingMs: clocks.blackMs,
        status: state.status,
        isSpectator: !isParticipant,
      },
    };
  }

  @SubscribeMessage('match:move')
  async handleMatchMove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { matchId: string; from: string; to: string; promotion?: string },
  ) {
    const user = client.data.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const moveResult = await this.gameEngineService.makeMove(payload.matchId, user.id, {
      from: payload.from,
      to: payload.to,
      promotion: payload.promotion,
    });

    if (!moveResult.success) {
      return { success: false, error: moveResult.error };
    }

    // Broadcast valid move to the entire match room
    this.server.to(`match:${payload.matchId}`).emit('match:move_applied', {
      matchId: payload.matchId,
      move: moveResult.move,
      fen: moveResult.fen,
      pgn: moveResult.pgn,
      turn: moveResult.turn,
      whiteTimeRemainingMs: moveResult.whiteTimeRemainingMs,
      blackTimeRemainingMs: moveResult.blackTimeRemainingMs,
    });

    // If move triggered checkmate, stalemate, etc.
    if (moveResult.isGameOver) {
      this.server.to(`match:${payload.matchId}`).emit('match:ended', {
        matchId: payload.matchId,
        result: moveResult.result,
        reason: moveResult.reason,
        winnerId: moveResult.winnerId,
        pgn: moveResult.pgn,
        finalFen: moveResult.fen,
      });

      const state = await this.gameEngineService.getOrLoadMatch(payload.matchId);
      if (state) {
        this.matchmakingService.releasePlayer(state.whitePlayerId);
        this.matchmakingService.releasePlayer(state.blackPlayerId);

        const standings = await this.leaderboardService.getTournamentLeaderboard(state.tournamentId);
        this.server.to(`tournament:${state.tournamentId}`).emit('leaderboard:updated', {
          tournamentId: state.tournamentId,
          standings,
        });
      }
    }

    return { success: true };
  }

  @SubscribeMessage('match:resign')
  async handleMatchResign(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { matchId: string },
  ) {
    const user = client.data.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const result = await this.gameEngineService.resign(payload.matchId, user.id);

      this.server.to(`match:${payload.matchId}`).emit('match:ended', {
        matchId: payload.matchId,
        ...result,
      });

      const state = await this.gameEngineService.getOrLoadMatch(payload.matchId);
      if (state) {
        this.matchmakingService.releasePlayer(state.whitePlayerId);
        this.matchmakingService.releasePlayer(state.blackPlayerId);

        const standings = await this.leaderboardService.getTournamentLeaderboard(state.tournamentId);
        this.server.to(`tournament:${state.tournamentId}`).emit('leaderboard:updated', {
          tournamentId: state.tournamentId,
          standings,
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage('match:offer_draw')
  async handleOfferDraw(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { matchId: string },
  ) {
    const user = client.data.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const { opponentId } = await this.gameEngineService.offerDraw(payload.matchId, user.id);
      this.server.to(`user:${opponentId}`).emit('match:draw_offered', {
        matchId: payload.matchId,
        fromUserId: user.id,
        fromUserName: user.name,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage('match:respond_draw')
  async handleRespondDraw(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { matchId: string; accept: boolean },
  ) {
    const user = client.data.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const response = await this.gameEngineService.respondDraw(
        payload.matchId,
        user.id,
        payload.accept,
      );

      if (response.accepted) {
        this.server.to(`match:${payload.matchId}`).emit('match:ended', {
          matchId: payload.matchId,
          result: response.result,
          reason: response.reason,
          pgn: response.pgn,
          finalFen: response.finalFen,
        });

        const state = await this.gameEngineService.getOrLoadMatch(payload.matchId);
        if (state) {
          this.matchmakingService.releasePlayer(state.whitePlayerId);
          this.matchmakingService.releasePlayer(state.blackPlayerId);

          const standings = await this.leaderboardService.getTournamentLeaderboard(state.tournamentId);
          this.server.to(`tournament:${state.tournamentId}`).emit('leaderboard:updated', {
            tournamentId: state.tournamentId,
            standings,
          });
        }
      } else {
        this.server.to(`match:${payload.matchId}`).emit('match:draw_declined', {
          matchId: payload.matchId,
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

