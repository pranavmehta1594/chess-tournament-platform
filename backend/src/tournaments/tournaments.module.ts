import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service.js';
import { TournamentsController } from './tournaments.controller.js';
import { LeaderboardModule } from '../leaderboard/leaderboard.module.js';

@Module({
  imports: [LeaderboardModule],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
