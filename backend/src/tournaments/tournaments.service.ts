import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, desc, and, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DbService } from '../db/db.service.js';
import * as schema from '../db/schema.js';
import { CreateTournamentDto } from './dto/create-tournament.dto.js';
import { UpdateTournamentDto } from './dto/update-tournament.dto.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly dbService: DbService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  private parseTimeControl(tc: string): { initialSeconds: number; incrementSeconds: number } {
    const parts = tc.split('+');
    const minutes = parseInt(parts[0], 10) || 5;
    const increment = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
    return {
      initialSeconds: minutes * 60,
      incrementSeconds: increment,
    };
  }

  async create(coachId: string, dto: CreateTournamentDto) {
    const { initialSeconds, incrementSeconds } = this.parseTimeControl(dto.timeControl);

    const [tournament] = await this.dbService.db
      .insert(schema.tournaments)
      .values({
        name: dto.name.trim(),
        timeControl: dto.timeControl.trim(),
        initialTimeSeconds: dto.initialTimeSeconds ?? initialSeconds,
        incrementSeconds: dto.incrementSeconds ?? incrementSeconds,
        startDateTime: new Date(dto.startDateTime),
        status: dto.status ?? 'OPEN',
        createdBy: coachId,
      })
      .returning();

    return tournament;
  }

  async findAll() {
    const allTournaments = await this.dbService.db
      .select({
        id: schema.tournaments.id,
        name: schema.tournaments.name,
        timeControl: schema.tournaments.timeControl,
        startDateTime: schema.tournaments.startDateTime,
        status: schema.tournaments.status,
        participantCount: count(schema.tournamentParticipants.id).mapWith(Number),
      })
      .from(schema.tournaments)
      .leftJoin(
        schema.tournamentParticipants,
        eq(schema.tournamentParticipants.tournamentId, schema.tournaments.id),
      )
      .groupBy(
        schema.tournaments.id,
        schema.tournaments.name,
        schema.tournaments.timeControl,
        schema.tournaments.startDateTime,
        schema.tournaments.status,
        schema.tournaments.createdAt,
      )
      .orderBy(desc(schema.tournaments.createdAt));

    return allTournaments;
  }

  async findOne(id: string) {
    const winnerUser = alias(schema.users, 'tournament_winner_user');

    const [tournament] = await this.dbService.db
      .select({
        id: schema.tournaments.id,
        name: schema.tournaments.name,
        timeControl: schema.tournaments.timeControl,
        startDateTime: schema.tournaments.startDateTime,
        status: schema.tournaments.status,
        creatorName: schema.users.name,
        winnerId: schema.tournaments.winnerId,
        winnerName: winnerUser.name,
      })
      .from(schema.tournaments)
      .leftJoin(schema.users, eq(schema.tournaments.createdBy, schema.users.id))
      .leftJoin(winnerUser, eq(schema.tournaments.winnerId, winnerUser.id))
      .where(eq(schema.tournaments.id, id))
      .limit(1);

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }

    // Fetch participants
    const participants = await this.dbService.db
      .select({
        userId: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.tournamentParticipants)
      .innerJoin(
        schema.users,
        eq(schema.tournamentParticipants.userId, schema.users.id),
      )
      .where(eq(schema.tournamentParticipants.tournamentId, id));

    return {
      ...tournament,
      participants,
      participantCount: participants.length,
    };
  }

  async update(id: string, dto: UpdateTournamentDto) {
    const [existing] = await this.dbService.db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }

    const updates: any = { updatedAt: new Date() };
    if (dto.name) updates.name = dto.name.trim();
    if (dto.timeControl) {
      updates.timeControl = dto.timeControl.trim();
      const { initialSeconds, incrementSeconds } = this.parseTimeControl(dto.timeControl);
      updates.initialTimeSeconds = dto.initialTimeSeconds ?? initialSeconds;
      updates.incrementSeconds = dto.incrementSeconds ?? incrementSeconds;
    }
    if (dto.startDateTime) updates.startDateTime = new Date(dto.startDateTime);
    if (dto.status) updates.status = dto.status;

    // If closing tournament, compute winner automatically if not set
    if (dto.status === 'COMPLETED' && !dto.winnerId) {
      const standings = await this.leaderboardService.getTournamentLeaderboard(id);
      if (standings.length > 0) {
        updates.winnerId = standings[0].userId;
      }
    } else if (dto.winnerId) {
      updates.winnerId = dto.winnerId;
    }

    const [updated] = await this.dbService.db
      .update(schema.tournaments)
      .set(updates)
      .where(eq(schema.tournaments.id, id))
      .returning();

    return updated;
  }

  async remove(id: string) {
    const [existing] = await this.dbService.db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }

    await this.dbService.db
      .delete(schema.tournaments)
      .where(eq(schema.tournaments.id, id));

    return { message: 'Tournament deleted successfully' };
  }

  async joinTournament(tournamentId: string, studentId: string) {
    const [tournament] = await this.dbService.db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, tournamentId))
      .limit(1);

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
    }

    if (tournament.status === 'COMPLETED') {
      throw new BadRequestException('Cannot join a completed tournament');
    }

    if (tournament.status === 'DRAFT') {
      throw new BadRequestException('Tournament registration is not open yet');
    }

    // Check if already registered
    const [existing] = await this.dbService.db
      .select()
      .from(schema.tournamentParticipants)
      .where(
        and(
          eq(schema.tournamentParticipants.tournamentId, tournamentId),
          eq(schema.tournamentParticipants.userId, studentId),
        ),
      )
      .limit(1);

    if (existing) {
      return { message: 'Already joined this tournament', participant: existing };
    }

    const [participant] = await this.dbService.db
      .insert(schema.tournamentParticipants)
      .values({
        tournamentId,
        userId: studentId,
        scoreMillipoints: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        buchholzScore: 0,
      })
      .returning();

    return { message: 'Joined tournament successfully', participant };
  }

  async addStudent(tournamentId: string, studentId: string) {
    const [student] = await this.dbService.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, studentId))
      .limit(1);

    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    return this.joinTournament(tournamentId, studentId);
  }

  async getMatches(tournamentId: string) {
    const whitePlayer = alias(schema.users, 'tournament_match_white_player');
    const blackPlayer = alias(schema.users, 'tournament_match_black_player');

    const matchesList = await this.dbService.db
      .select({
        id: schema.matches.id,
        status: schema.matches.status,
        result: schema.matches.result,
        terminationReason: schema.matches.terminationReason,
        startedAt: schema.matches.startedAt,
        whitePlayer: {
          id: schema.matches.whitePlayerId,
          name: whitePlayer.name,
        },
        blackPlayer: {
          id: schema.matches.blackPlayerId,
          name: blackPlayer.name,
        },
      })
      .from(schema.matches)
      .innerJoin(whitePlayer, eq(schema.matches.whitePlayerId, whitePlayer.id))
      .innerJoin(blackPlayer, eq(schema.matches.blackPlayerId, blackPlayer.id))
      .where(eq(schema.matches.tournamentId, tournamentId))
      .orderBy(desc(schema.matches.startedAt));

    return matchesList;
  }
}

