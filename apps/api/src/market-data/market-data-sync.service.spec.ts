import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataSyncService } from './market-data-sync.service';
import { PrismaService } from '../database/prisma.service';
import { MarketDataService } from './market-data.service';

describe('MarketDataSyncService', () => {
  let service: MarketDataSyncService;
  let prisma: {
    watchlistItem: { findMany: jest.Mock };
    favouriteAsset: { findMany: jest.Mock };
    position: { findMany: jest.Mock };
  };
  let marketDataService: { getQuote: jest.Mock };

  beforeEach(async () => {
    prisma = {
      watchlistItem: { findMany: jest.fn().mockResolvedValue([{ assetId: 'asset-1' }]) },
      favouriteAsset: { findMany: jest.fn().mockResolvedValue([{ assetId: 'asset-2' }]) },
      position: { findMany: jest.fn().mockResolvedValue([{ assetId: 'asset-1' }]) },
    };
    marketDataService = { getQuote: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataSyncService,
        { provide: PrismaService, useValue: prisma },
        { provide: MarketDataService, useValue: marketDataService },
      ],
    }).compile();

    service = module.get<MarketDataSyncService>(MarketDataSyncService);
  });

  it('deduplicates tracked assets across watchlists, favourites, and positions', async () => {
    const assetIds = await service.getTrackedAssetIds();

    expect(assetIds.sort()).toEqual(['asset-1', 'asset-2']);
  });

  it('refreshes a quote for every tracked asset, tolerating individual failures', async () => {
    marketDataService.getQuote.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('provider down'));

    await expect(service.syncTrackedAssets()).resolves.toBeUndefined();

    expect(marketDataService.getQuote).toHaveBeenCalledTimes(2);
  });

  it('only queries positions with a nonzero quantity', async () => {
    await service.getTrackedAssetIds();

    expect(prisma.position.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { quantity: { gt: 0 } } }),
    );
  });
});
