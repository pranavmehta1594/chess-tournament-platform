import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module.js';
import { AuthModule } from './auth/auth.module.js';
import { LeaderboardModule } from './leaderboard/leaderboard.module.js';
import { TournamentsModule } from './tournaments/tournaments.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { GameModule } from './game/game.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    DbModule,
    AuthModule,
    LeaderboardModule,
    TournamentsModule,
    MatchesModule,
    GameModule,
  ],
})
export class AppModule {}
