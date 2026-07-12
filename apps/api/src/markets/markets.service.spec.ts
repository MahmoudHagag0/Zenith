import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { MarketsService } from './markets.service';
import { PrismaService } from '../database/prisma.service';

describe('MarketsService', () => {
  let service: MarketsService;
  let prisma: {
    exchange: { findUnique: jest.Mock };
    market: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      exchange: { findUnique: jest.fn() },
      market: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<MarketsService>(MarketsService);
  });

  it('creates a market when the parent exchange exists', async () => {
    prisma.exchange.findUnique.mockResolvedValue({ id: 'ex-1' });
    prisma.market.findUnique.mockResolvedValue(null);
    prisma.market.create.mockResolvedValue({ id: 'mk-1', exchangeId: 'ex-1', name: 'US Equities' });

    const market = await service.create({ exchangeId: 'ex-1', name: 'US Equities', type: 'EQUITY' });

    expect(market.name).toBe('US Equities');
  });

  it('rejects creation when the parent exchange does not exist', async () => {
    prisma.exchange.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ exchangeId: 'missing', name: 'US Equities', type: 'EQUITY' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.market.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate market name within the same exchange', async () => {
    prisma.exchange.findUnique.mockResolvedValue({ id: 'ex-1' });
    prisma.market.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create({ exchangeId: 'ex-1', name: 'US Equities', type: 'EQUITY' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('converts a concurrent unique-constraint violation into a clean 409', async () => {
    prisma.exchange.findUnique.mockResolvedValue({ id: 'ex-1' });
    prisma.market.findUnique.mockResolvedValue(null);
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.market.create.mockRejectedValue(uniqueViolation);

    await expect(
      service.create({ exchangeId: 'ex-1', name: 'US Equities', type: 'EQUITY' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException for a missing market', async () => {
    prisma.market.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
