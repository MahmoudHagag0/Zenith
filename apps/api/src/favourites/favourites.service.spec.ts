import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { FavouritesService } from './favourites.service';
import { PrismaService } from '../database/prisma.service';

describe('FavouritesService', () => {
  let service: FavouritesService;
  let prisma: {
    favouriteAsset: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; delete: jest.Mock };
    asset: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      favouriteAsset: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      asset: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FavouritesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<FavouritesService>(FavouritesService);
  });

  it('favourites an asset for the requesting user', async () => {
    prisma.asset.findUnique.mockResolvedValue({ id: 'asset-1' });
    prisma.favouriteAsset.findUnique.mockResolvedValue(null);
    prisma.favouriteAsset.create.mockResolvedValue({ id: 'fav-1', userId: 'user-1', assetId: 'asset-1' });

    const favourite = await service.create('user-1', 'asset-1');

    expect(favourite.userId).toBe('user-1');
  });

  it('rejects favouriting a non-existent asset', async () => {
    prisma.asset.findUnique.mockResolvedValue(null);

    await expect(service.create('user-1', 'missing-asset')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.favouriteAsset.create).not.toHaveBeenCalled();
  });

  it('rejects favouriting the same asset twice', async () => {
    prisma.asset.findUnique.mockResolvedValue({ id: 'asset-1' });
    prisma.favouriteAsset.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(service.create('user-1', 'asset-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('converts a concurrent unique-constraint violation into a clean 409', async () => {
    prisma.asset.findUnique.mockResolvedValue({ id: 'asset-1' });
    prisma.favouriteAsset.findUnique.mockResolvedValue(null);
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.favouriteAsset.create.mockRejectedValue(uniqueViolation);

    await expect(service.create('user-1', 'asset-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 when removing a favourite that does not belong to the requesting user', async () => {
    prisma.favouriteAsset.findUnique.mockResolvedValue(null);

    await expect(service.remove('user-1', 'asset-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.favouriteAsset.delete).not.toHaveBeenCalled();
  });
});
