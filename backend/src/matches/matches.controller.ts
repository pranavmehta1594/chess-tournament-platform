import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('my-history')
  async getMyMatches(@CurrentUser('id') userId: string) {
    return this.matchesService.findUserMatches(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }
}

