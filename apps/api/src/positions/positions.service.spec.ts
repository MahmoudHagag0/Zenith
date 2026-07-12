import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { PositionsService } from './positions.service';
import { PrismaService } from '../database/prisma.service';
import { PortfoliosService } from '../portfolios/portfolios.service';

describe('PositionsService', () => {
  let service: PositionsService;
  let portfoliosService: { findOwned: jest.Mock };
  let tx: {
    position: {
      upsert: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
    };
    transaction: { create: jest.Mock };
    $queryRaw: jest.Mock;
  };
  let prisma: {
    asset: { findUnique: jest.Mock };
    position: { findMany: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
    transaction: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    tx = {
      position: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      transaction: { create: jest.fn() },
      $queryRaw: jest.fn(),
    };
    prisma = {
      asset: { findUnique: jest.fn() },
      position: { findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
      transaction: { findMany: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx)),
    };
    portfoliosService = { findOwned: jest.fn().mockResolvedValue({ id: 'pf-1', userId: 'user-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PortfoliosService, useValue: portfoliosService },
      ],
    }).compile();

    service = module.get<PositionsService>(PositionsService);
  });

  function decimalPosition(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'pos-1',
      portfolioId: 'pf-1',
      assetId: 'as-1',
      quantity: new Prisma.Decimal(0),
      averageCost: new Prisma.Decimal(0),
      realizedPnl: new Prisma.Decimal(0),
      ...overrides,
    };
  }

  describe('buy', () => {
    it('rejects buying an asset that does not exist', async () => {
      prisma.asset.findUnique.mockResolvedValue(null);

      await expect(
        service.buy('user-1', 'pf-1', { assetId: 'missing', quantity: 10, price: 5 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('computes weighted average cost on the first buy', async () => {
      prisma.asset.findUnique.mockResolvedValue({ id: 'as-1' });
      const initial = decimalPosition();
      tx.position.upsert.mockResolvedValue(initial);
      tx.position.findUniqueOrThrow.mockResolvedValue(initial);
      tx.position.update.mockImplementation(({ data }) => ({ ...initial, ...data }));

      const result = await service.buy('user-1', 'pf-1', { assetId: 'as-1', quantity: 10, price: 100 });

      expect(result.quantity.toString()).toBe('10');
      expect(result.averageCost.toString()).toBe('100');
      expect(tx.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'BUY' }) }),
      );
    });

    it('computes weighted average cost across two buys at different prices', async () => {
      prisma.asset.findUnique.mockResolvedValue({ id: 'as-1' });
      // Position already holds 10 units at avg cost 100 from a prior buy.
      const existing = decimalPosition({
        quantity: new Prisma.Decimal(10),
        averageCost: new Prisma.Decimal(100),
      });
      tx.position.upsert.mockResolvedValue(existing);
      tx.position.findUniqueOrThrow.mockResolvedValue(existing);
      tx.position.update.mockImplementation(({ data }) => ({ ...existing, ...data }));

      // Buy 10 more units at price 200 -> new avg = (10*100 + 10*200) / 20 = 150
      const result = await service.buy('user-1', 'pf-1', { assetId: 'as-1', quantity: 10, price: 200 });

      expect(result.quantity.toString()).toBe('20');
      expect(result.averageCost.toString()).toBe('150');
    });
  });

  describe('sell', () => {
    it('rejects selling when no position exists for the asset', async () => {
      prisma.asset.findUnique.mockResolvedValue({ id: 'as-1' });
      tx.position.findUnique.mockResolvedValue(null);

      await expect(
        service.sell('user-1', 'pf-1', { assetId: 'as-1', quantity: 5, price: 100 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects selling more than the currently held quantity', async () => {
      prisma.asset.findUnique.mockResolvedValue({ id: 'as-1' });
      const existing = decimalPosition({
        quantity: new Prisma.Decimal(5),
        averageCost: new Prisma.Decimal(100),
      });
      tx.position.findUnique.mockResolvedValue(existing);
      tx.position.findUniqueOrThrow.mockResolvedValue(existing);

      await expect(
        service.sell('user-1', 'pf-1', { assetId: 'as-1', quantity: 10, price: 150 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.position.update).not.toHaveBeenCalled();
    });

    it('computes realized P/L and reduces quantity without changing average cost on a partial sell', async () => {
      prisma.asset.findUnique.mockResolvedValue({ id: 'as-1' });
      const existing = decimalPosition({
        quantity: new Prisma.Decimal(10),
        averageCost: new Prisma.Decimal(100),
        realizedPnl: new Prisma.Decimal(0),
      });
      tx.position.findUnique.mockResolvedValue(existing);
      tx.position.findUniqueOrThrow.mockResolvedValue(existing);
      tx.position.update.mockImplementation(({ data }) => ({ ...existing, ...data }));

      // Sell 4 units at price 150 -> realized gain = 4 * (150 - 100) = 200
      const result = await service.sell('user-1', 'pf-1', { assetId: 'as-1', quantity: 4, price: 150 });

      expect(result.quantity.toString()).toBe('6');
      expect(result.averageCost.toString()).toBe('100');
      expect(result.realizedPnl.toString()).toBe('200');
    });

    it('resets average cost to zero when a position is fully closed', async () => {
      prisma.asset.findUnique.mockResolvedValue({ id: 'as-1' });
      const existing = decimalPosition({
        quantity: new Prisma.Decimal(10),
        averageCost: new Prisma.Decimal(100),
      });
      tx.position.findUnique.mockResolvedValue(existing);
      tx.position.findUniqueOrThrow.mockResolvedValue(existing);
      tx.position.update.mockImplementation(({ data }) => ({ ...existing, ...data }));

      const result = await service.sell('user-1', 'pf-1', { assetId: 'as-1', quantity: 10, price: 120 });

      expect(result.quantity.toString()).toBe('0');
      expect(result.averageCost.toString()).toBe('0');
      expect(result.realizedPnl.toString()).toBe('200');
    });
  });

  describe('remove', () => {
    it('rejects deleting a position that still has an open quantity', async () => {
      prisma.position.findUnique.mockResolvedValue(
        decimalPosition({ quantity: new Prisma.Decimal(5) }),
      );

      await expect(service.remove('user-1', 'pf-1', 'pos-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.position.delete).not.toHaveBeenCalled();
    });

    it('allows deleting a fully-closed position', async () => {
      prisma.position.findUnique.mockResolvedValue(
        decimalPosition({ quantity: new Prisma.Decimal(0) }),
      );

      await service.remove('user-1', 'pf-1', 'pos-1');

      expect(prisma.position.delete).toHaveBeenCalledWith({ where: { id: 'pos-1' } });
    });

    it('returns 404 for a position belonging to a different portfolio', async () => {
      prisma.position.findUnique.mockResolvedValue(
        decimalPosition({ portfolioId: 'other-portfolio' }),
      );

      await expect(service.remove('user-1', 'pf-1', 'pos-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
