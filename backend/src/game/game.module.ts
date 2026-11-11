import { Module } from '@nestjs/common';
import { GameEngineService } from './game-engine.service.js';
import { MatchmakingService } from './matchmaking.service.js';
import { GameGateway } from './game.gateway.js';
import { LeaderboardModule } from '../leaderboard/leaderboard.module.js';

@Module({
  imports: [LeaderboardModule],
  providers: [GameEngineService, MatchmakingService, GameGateway],
  exports: [GameEngineService, MatchmakingService, GameGateway],
})
export class GameModule {}
