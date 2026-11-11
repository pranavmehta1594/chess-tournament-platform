import { describe, it, expect, vi } from 'vitest';
import { TournamentsService } from './tournaments.service.js';
import { BadRequestException } from '@nestjs/common';

describe('TournamentsService (Join rules & Time control parsing)', () => {
  it('correctly parses time control formats (5+0, 3+2, 10+5)', () => {
    const dummyDb: any = { db: {} };
    const dummyLeaderboard: any = {};
    const service = new TournamentsService(dummyDb, dummyLeaderboard);

    // Call private parseTimeControl via reflection/casting
    const parse = (service as any).parseTimeControl.bind(service);

    expect(parse('5+0')).toEqual({ initialSeconds: 300, incrementSeconds: 0 });
    expect(parse('3+2')).toEqual({ initialSeconds: 180, incrementSeconds: 2 });
    expect(parse('10+5')).toEqual({ initialSeconds: 600, incrementSeconds: 5 });
  });

  it('rejects joining a COMPLETED tournament', async () => {
    const mockDb: any = {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi.fn().mockResolvedValue([{ id: 't1', status: 'COMPLETED' }]),
            }),
          }),
        }),
      },
    };

    const service = new TournamentsService(mockDb, {} as any);

    await expect(service.joinTournament('t1', 's1')).rejects.toThrow(BadRequestException);
  });

  it('rejects joining a DRAFT tournament', async () => {
    const mockDb: any = {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi.fn().mockResolvedValue([{ id: 't2', status: 'DRAFT' }]),
            }),
          }),
        }),
      },
    };

    const service = new TournamentsService(mockDb, {} as any);

    await expect(service.joinTournament('t2', 's1')).rejects.toThrow(BadRequestException);
  });
});

