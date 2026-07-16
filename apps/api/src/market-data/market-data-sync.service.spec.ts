import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataSyncService } from './market-data-sync.service';
import { TrackedAssetsService } from '../tracked-assets/tracked-assets.service';
import { MarketDataService } from './market-data.service';

describe('MarketDataSyncService', () => {
  let service: MarketDataSyncService;
  let trackedAssetsService: { getAllTrackedAssetIds: jest.Mock };
  let marketDataService: { getQuote: jest.Mock };

  beforeEach(async () => {
    trackedAssetsService = { getAllTrackedAssetIds: jest.fn().mockResolvedValue(['asset-1', 'asset-2']) };
    marketDataService = { getQuote: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataSyncService,
        { provide: TrackedAssetsService, useValue: trackedAssetsService },
        { provide: MarketDataService, useValue: marketDataService },
      ],
    }).compile();

    service = module.get<MarketDataSyncService>(MarketDataSyncService);
  });

  it('delegates tracked-asset gathering to TrackedAssetsService.getAllTrackedAssetIds()', async () => {
    const assetIds = await service.getTrackedAssetIds();

    expect(assetIds).toEqual(['asset-1', 'asset-2']);
    expect(trackedAssetsService.getAllTrackedAssetIds).toHaveBeenCalledTimes(1);
  });

  it('refreshes a quote for every tracked asset, tolerating individual failures', async () => {
    marketDataService.getQuote.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('provider down'));

    await expect(service.syncTrackedAssets()).resolves.toBeUndefined();

    expect(marketDataService.getQuote).toHaveBeenCalledTimes(2);
  });
});
