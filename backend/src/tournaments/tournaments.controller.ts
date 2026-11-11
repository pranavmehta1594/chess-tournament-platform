import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service.js';
import { CreateTournamentDto } from './dto/create-tournament.dto.js';
import { UpdateTournamentDto } from './dto/update-tournament.dto.js';
import { AddStudentDto } from './dto/add-student.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';

@Controller('tournaments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  @Get()
  async findAll() {
    return this.tournamentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Post()
  @Roles('COACH')
  async create(
    @CurrentUser('id') coachId: string,
    @Body() createDto: CreateTournamentDto,
  ) {
    return this.tournamentsService.create(coachId, createDto);
  }

  @Patch(':id')
  @Roles('COACH')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTournamentDto,
  ) {
    return this.tournamentsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('COACH')
  async remove(@Param('id') id: string) {
    return this.tournamentsService.remove(id);
  }

  @Post(':id/join')
  @Roles('STUDENT')
  async join(
    @Param('id') id: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.tournamentsService.joinTournament(id, studentId);
  }

  @Post(':id/add-student')
  @Roles('COACH')
  async addStudent(
    @Param('id') id: string,
    @Body() addStudentDto: AddStudentDto,
  ) {
    return this.tournamentsService.addStudent(id, addStudentDto.studentId);
  }

  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') id: string) {
    return this.leaderboardService.getTournamentLeaderboard(id);
  }

  @Get(':id/matches')
  async getMatches(@Param('id') id: string) {
    return this.tournamentsService.getMatches(id);
  }
}

