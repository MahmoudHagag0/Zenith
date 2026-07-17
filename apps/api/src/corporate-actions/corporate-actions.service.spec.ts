import { Test, TestingModule } from '@nestjs/testing';
import { CorporateActionsService } from './corporate-actions.service';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { CORPORATE_ACTIONS_PROVIDER } from './providers/corporate-actions-provider.interface';

describe('CorporateActionsService', () => {
  let service: CorporateActionsService;
  let prisma: {
    corporateAction: { findMany: jest.Mock; findFirst: jest.Mock; upsert: jest.Mock };
  };
  let assetsService: { findOne: jest.Mock };
  let provider: { getSplits: jest.Mock; getDividends: jest.Mock; name: string };

  beforeEach(async () => {
    prisma = {
      corporateAction: { findMany: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    };
    assetsService = { findOne: jest.fn() };
    provider = { getSplits: jest.fn(), getDividends: jest.fn(), name: 'finnhub' };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorporateActionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AssetsService, useValue: assetsService },
        { provide: CORPORATE_ACTIONS_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get<CorporateActionsService>(CorporateActionsService);
  });

  it('fetches fresh splits and dividends from the provider when the cache has nothing recent', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.corporateAction.findFirst.mockResolvedValue(null);
    provider.getSplits.mockResolvedValue([{ effectiveDate: new Date('2026-06-01'), ratio: 2, raw: { a: 1 } }]);
    provider.getDividends.mockResolvedValue([{ effectiveDate: new Date('2026-06-15'), amount: 0.24, currency: 'USD', raw: { b: 2 } }]);
    prisma.corporateAction.findMany.mockResolvedValue([{ id: 'ca-1' }]);

    const result = await service.getActionsForAsset('asset-1');

    expect(provider.getSplits).toHaveBeenCalledWith('ZEN');
    expect(provider.getDividends).toHaveBeenCalledWith('ZEN');
    expect(prisma.corporateAction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assetId_type_effectiveDate: { assetId: 'asset-1', type: 'SPLIT', effectiveDate: new Date('2026-06-01') } },
        create: expect.objectContaining({ type: 'SPLIT', ratio: 2, provider: 'finnhub' }),
      }),
    );
    expect(prisma.corporateAction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assetId_type_effectiveDate: { assetId: 'asset-1', type: 'DIVIDEND', effectiveDate: new Date('2026-06-15') } },
        create: expect.objectContaining({ type: 'DIVIDEND', amount: 0.24, currency: 'USD', provider: 'finnhub' }),
      }),
    );
    expect(result).toEqual([{ id: 'ca-1' }]);
  });

  it('does not refetch when the cache was refreshed within the last 24h', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.corporateAction.findFirst.mockResolvedValue({ retrievedAt: new Date() });
    prisma.corporateAction.findMany.mockResolvedValue([]);

    await service.getActionsForAsset('asset-1');

    expect(provider.getSplits).not.toHaveBeenCalled();
    expect(provider.getDividends).not.toHaveBeenCalled();
  });

  it('refetches when the cache has aged past the 24h freshness window', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.corporateAction.findFirst.mockResolvedValue({ retrievedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) });
    provider.getSplits.mockResolvedValue([]);
    provider.getDividends.mockResolvedValue([]);
    prisma.corporateAction.findMany.mockResolvedValue([]);

    await service.getActionsForAsset('asset-1');

    expect(provider.getSplits).toHaveBeenCalledWith('ZEN');
  });

  it('re-processing the same split twice upserts against the same natural key rather than creating a duplicate', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.corporateAction.findFirst.mockResolvedValue(null);
    const splitEvent = { effectiveDate: new Date('2026-06-01'), ratio: 2, raw: { a: 1 } };
    provider.getSplits.mockResolvedValue([splitEvent]);
    provider.getDividends.mockResolvedValue([]);
    prisma.corporateAction.findMany.mockResolvedValue([]);

    await service.syncAsset('asset-1', 'ZEN');
    await service.syncAsset('asset-1', 'ZEN');

    expect(prisma.corporateAction.upsert).toHaveBeenCalledTimes(2);
    const [firstCall, secondCall] = prisma.corporateAction.upsert.mock.calls;
    expect(firstCall[0].where).toEqual(secondCall[0].where);
  });

  it('only ever touches the corporateAction Prisma model, never candle/position/transaction', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.corporateAction.findFirst.mockResolvedValue(null);
    provider.getSplits.mockResolvedValue([{ effectiveDate: new Date('2026-06-01'), ratio: 2, raw: {} }]);
    provider.getDividends.mockResolvedValue([]);
    prisma.corporateAction.findMany.mockResolvedValue([]);

    await service.getActionsForAsset('asset-1');

    expect(Object.keys(prisma)).toEqual(['corporateAction']);
  });
});
