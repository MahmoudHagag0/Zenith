import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataSyncService } from './market-data-sync.service';
import { TrackedAssetsService } from '../tracked-assets/tracked-assets.service';
import { MarketDataService } from './market-data.service';
import { MARKET_SESSION_PROVIDER } from './providers/market-session-provider.interface';
import { LiveDataObservabilityService } from '../monitoring/live-data-observability.service';

describe('MarketDataSyncService', () => {
  let service: MarketDataSyncService;
  let trackedAssetsService: { getAllTrackedAssetIds: jest.Mock; getAllTrackedAssetsWithExchange: jest.Mock };
  let marketDataService: { getQuote: jest.Mock };
  let marketSessionProvider: { getMarketStatus: jest.Mock };
  let liveDataObservabilityService: { recordSync: jest.Mock };

  beforeEach(async () => {
    trackedAssetsService = {
      getAllTrackedAssetIds: jest.fn().mockResolvedValue(['asset-1', 'asset-2']),
      getAllTrackedAssetsWithExchange: jest.fn().mockResolvedValue([
        { assetId: 'asset-1', exchangeCode: 'XNAS' },
        { assetId: 'asset-2', exchangeCode: 'XLON' },
      ]),
    };
    marketDataService = { getQuote: jest.fn().mockResolvedValue({}) };
    marketSessionProvider = { getMarketStatus: jest.fn().mockResolvedValue('OPEN') };
    liveDataObservabilityService = { recordSync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataSyncService,
        { provide: TrackedAssetsService, useValue: trackedAssetsService },
        { provide: MarketDataService, useValue: marketDataService },
        { provide: MARKET_SESSION_PROVIDER, useValue: marketSessionProvider },
        { provide: LiveDataObservabilityService, useValue: liveDataObservabilityService },
      ],
    }).compile();

    service = module.get<MarketDataSyncService>(MarketDataSyncService);
  });

  it('records sync results in LiveDataObservabilityService under the "market-data" domain', async () => {
    marketDataService.getQuote.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('provider down'));

    await service.syncTrackedAssets();

    expect(liveDataObservabilityService.recordSync).toHaveBeenCalledWith('market-data', 1, 1);
  });

  it('delegates tracked-asset gathering to TrackedAssetsService.getAllTrackedAssetIds()', async () => {
    const assetIds = await service.getTrackedAssetIds();

    expect(assetIds).toEqual(['asset-1', 'asset-2']);
    expect(trackedAssetsService.getAllTrackedAssetIds).toHaveBeenCalledTimes(1);
  });

  it('refreshes a quote for every tracked asset whose market is open, tolerating individual failures', async () => {
    marketDataService.getQuote.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('provider down'));

    await expect(service.syncTrackedAssets()).resolves.toBeUndefined();

    expect(marketDataService.getQuote).toHaveBeenCalledTimes(2);
  });

  it('skips polling an asset whose exchange is confirmed closed', async () => {
    marketSessionProvider.getMarketStatus.mockResolvedValueOnce('CLOSED').mockResolvedValueOnce('OPEN');

    await service.syncTrackedAssets();

    expect(marketDataService.getQuote).toHaveBeenCalledTimes(1);
    expect(marketDataService.getQuote).toHaveBeenCalledWith('asset-2');
  });

  it('fails open (still polls) when market status is UNKNOWN', async () => {
    marketSessionProvider.getMarketStatus.mockResolvedValue('UNKNOWN');

    await service.syncTrackedAssets();

    expect(marketDataService.getQuote).toHaveBeenCalledTimes(2);
  });

  it('fails open (still polls) when the session lookup itself throws', async () => {
    marketSessionProvider.getMarketStatus.mockRejectedValue(new Error('config lookup failed'));

    await service.syncTrackedAssets();

    expect(marketDataService.getQuote).toHaveBeenCalledTimes(2);
  });
});
