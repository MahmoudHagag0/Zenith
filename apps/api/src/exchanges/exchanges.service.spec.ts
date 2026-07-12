import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { ExchangesService } from './exchanges.service';
import { PrismaService } from '../database/prisma.service';

describe('ExchangesService', () => {
  let service: ExchangesService;
  let prisma: {
    exchange: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      exchange: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExchangesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ExchangesService>(ExchangesService);
  });

  it('creates an exchange', async () => {
    prisma.exchange.findUnique.mockResolvedValue(null);
    prisma.exchange.create.mockResolvedValue({ id: 'ex-1', name: 'NASDAQ', code: 'NASDAQ' });

    const exchange = await service.create({ name: 'NASDAQ', code: 'NASDAQ' });

    expect(exchange.code).toBe('NASDAQ');
  });

  it('rejects a duplicate exchange code', async () => {
    prisma.exchange.findUnique.mockResolvedValue({ id: 'existing', code: 'NASDAQ' });

    await expect(service.create({ name: 'NASDAQ', code: 'NASDAQ' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.exchange.create).not.toHaveBeenCalled();
  });

  it('converts a concurrent unique-constraint violation into a clean 409', async () => {
    prisma.exchange.findUnique.mockResolvedValue(null);
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.exchange.create.mockRejectedValue(uniqueViolation);

    await expect(service.create({ name: 'NASDAQ', code: 'NASDAQ' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws NotFoundException for a missing exchange', async () => {
    prisma.exchange.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when updating a missing exchange', async () => {
    prisma.exchange.findUnique.mockResolvedValue(null);

    await expect(service.update('missing-id', { name: 'New Name' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.exchange.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when removing a missing exchange', async () => {
    prisma.exchange.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.exchange.delete).not.toHaveBeenCalled();
  });
});
