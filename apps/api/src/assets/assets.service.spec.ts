import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { AssetsService } from './assets.service';
import { PrismaService } from '../database/prisma.service';

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: {
    market: { findUnique: jest.Mock };
    asset: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      market: { findUnique: jest.fn() },
      asset: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  it('creates an asset when the parent market exists', async () => {
    prisma.market.findUnique.mockResolvedValue({ id: 'mk-1' });
    prisma.asset.findUnique.mockResolvedValue(null);
    prisma.asset.create.mockResolvedValue({ id: 'as-1', marketId: 'mk-1', symbol: 'AAPL', name: 'Apple Inc.' });

    const asset = await service.create({ marketId: 'mk-1', symbol: 'AAPL', name: 'Apple Inc.' });

    expect(asset.symbol).toBe('AAPL');
  });

  it('rejects creation when the parent market does not exist', async () => {
    prisma.market.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ marketId: 'missing', symbol: 'AAPL', name: 'Apple Inc.' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.asset.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate symbol within the same market', async () => {
    prisma.market.findUnique.mockResolvedValue({ id: 'mk-1' });
    prisma.asset.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create({ marketId: 'mk-1', symbol: 'AAPL', name: 'Apple Inc.' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('converts a concurrent unique-constraint violation into a clean 409', async () => {
    prisma.market.findUnique.mockResolvedValue({ id: 'mk-1' });
    prisma.asset.findUnique.mockResolvedValue(null);
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.asset.create.mockRejectedValue(uniqueViolation);

    await expect(
      service.create({ marketId: 'mk-1', symbol: 'AAPL', name: 'Apple Inc.' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException for a missing asset', async () => {
    prisma.asset.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
