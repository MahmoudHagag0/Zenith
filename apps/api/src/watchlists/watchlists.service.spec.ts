import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { WatchlistsService } from './watchlists.service';
import { PrismaService } from '../database/prisma.service';

describe('WatchlistsService', () => {
  let service: WatchlistsService;
  let prisma: {
    watchlist: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    watchlistItem: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; delete: jest.Mock };
    asset: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      watchlist: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      watchlistItem: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      asset: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WatchlistsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<WatchlistsService>(WatchlistsService);
  });

  it('creates a watchlist owned by the requesting user', async () => {
    prisma.watchlist.findUnique.mockResolvedValue(null);
    prisma.watchlist.create.mockResolvedValue({ id: 'wl-1', userId: 'user-1', name: 'Tech' });

    const watchlist = await service.create('user-1', { name: 'Tech' });

    expect(watchlist.userId).toBe('user-1');
  });

  it('rejects a duplicate watchlist name for the same user', async () => {
    prisma.watchlist.findUnique.mockResolvedValue({ id: 'existing', userId: 'user-1', name: 'Tech' });

    await expect(service.create('user-1', { name: 'Tech' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('converts a concurrent unique-constraint violation into a clean 409', async () => {
    prisma.watchlist.findUnique.mockResolvedValue(null);
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.watchlist.create.mockRejectedValue(uniqueViolation);

    await expect(service.create('user-1', { name: 'Tech' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 (not 403) when a watchlist exists but is owned by another user', async () => {
    prisma.watchlist.findUnique.mockResolvedValue({ id: 'wl-1', userId: 'someone-else', name: 'Tech' });

    await expect(service.findOne('user-1', 'wl-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for a watchlist that does not exist at all', async () => {
    prisma.watchlist.findUnique.mockResolvedValue(null);

    await expect(service.findOne('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects adding an item for a watchlist owned by another user', async () => {
    prisma.watchlist.findUnique.mockResolvedValue({ id: 'wl-1', userId: 'someone-else', name: 'Tech' });

    await expect(service.addItem('user-1', 'wl-1', 'asset-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.watchlistItem.create).not.toHaveBeenCalled();
  });

  it('rejects adding a non-existent asset to a watchlist', async () => {
    prisma.watchlist.findUnique.mockResolvedValue({ id: 'wl-1', userId: 'user-1', name: 'Tech' });
    prisma.asset.findUnique.mockResolvedValue(null);

    await expect(service.addItem('user-1', 'wl-1', 'missing-asset')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects adding the same asset to a watchlist twice', async () => {
    prisma.watchlist.findUnique.mockResolvedValue({ id: 'wl-1', userId: 'user-1', name: 'Tech' });
    prisma.asset.findUnique.mockResolvedValue({ id: 'asset-1' });
    prisma.watchlistItem.findUnique.mockResolvedValue({ id: 'item-1' });

    await expect(service.addItem('user-1', 'wl-1', 'asset-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
