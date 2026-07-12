import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { PortfoliosService } from './portfolios.service';
import { PrismaService } from '../database/prisma.service';

describe('PortfoliosService', () => {
  let service: PortfoliosService;
  let prisma: {
    portfolio: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      portfolio: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PortfoliosService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PortfoliosService>(PortfoliosService);
  });

  it('creates a portfolio owned by the requesting user', async () => {
    prisma.portfolio.findUnique.mockResolvedValue(null);
    prisma.portfolio.create.mockResolvedValue({ id: 'pf-1', userId: 'user-1', name: 'Main' });

    const portfolio = await service.create('user-1', { name: 'Main' });

    expect(portfolio.userId).toBe('user-1');
  });

  it('rejects a duplicate portfolio name for the same user', async () => {
    prisma.portfolio.findUnique.mockResolvedValue({ id: 'existing', userId: 'user-1', name: 'Main' });

    await expect(service.create('user-1', { name: 'Main' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('converts a concurrent unique-constraint violation into a clean 409', async () => {
    prisma.portfolio.findUnique.mockResolvedValue(null);
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.portfolio.create.mockRejectedValue(uniqueViolation);

    await expect(service.create('user-1', { name: 'Main' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 (not 403) when a portfolio exists but is owned by another user', async () => {
    prisma.portfolio.findUnique.mockResolvedValue({ id: 'pf-1', userId: 'someone-else', name: 'Main' });

    await expect(service.findOwned('user-1', 'pf-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for a portfolio that does not exist at all', async () => {
    prisma.portfolio.findUnique.mockResolvedValue(null);

    await expect(service.findOwned('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects removing a portfolio owned by another user', async () => {
    prisma.portfolio.findUnique.mockResolvedValue({ id: 'pf-1', userId: 'someone-else', name: 'Main' });

    await expect(service.remove('user-1', 'pf-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.portfolio.delete).not.toHaveBeenCalled();
  });
});
