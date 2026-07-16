import { Test, TestingModule } from '@nestjs/testing';
import { MarketSessionSyncService } from './market-session-sync.service';
import { TrackedAssetsService } from '../tracked-assets/tracked-assets.service';
import { MARKET_SESSION_PROVIDER } from './providers/market-session-provider.interface';

describe('MarketSessionSyncService', () => {
  let service: MarketSessionSyncService;
  let trackedAssetsService: { getAllTrackedAssetsWithExchange: jest.Mock };
  let marketSessionProvider: { getMarketStatus: jest.Mock };

  beforeEach(async () => {
    trackedAssetsService = {
      getAllTrackedAssetsWithExchange: jest.fn().mockResolvedValue([
        { assetId: 'asset-1', exchangeCode: 'XNAS' },
        { assetId: 'asset-2', exchangeCode: 'ZDX' },
      ]),
    };
    marketSessionProvider = { getMarketStatus: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketSessionSyncService,
        { provide: TrackedAssetsService, useValue: trackedAssetsService },
        { provide: MARKET_SESSION_PROVIDER, useValue: marketSessionProvider },
      ],
    }).compile();

    service = module.get<MarketSessionSyncService>(MarketSessionSyncService);
  });

  it('checks each distinct tracked exchange code exactly once', async () => {
    marketSessionProvider.getMarketStatus.mockResolvedValue('OPEN');

    await service.checkSessionCoverage();

    expect(marketSessionProvider.getMarketStatus).toHaveBeenCalledTimes(2);
    expect(marketSessionProvider.getMarketStatus).toHaveBeenCalledWith('XNAS');
    expect(marketSessionProvider.getMarketStatus).toHaveBeenCalledWith('ZDX');
  });

  it('does not throw when an exchange has no configured entry (UNKNOWN) -- it logs, not fails', async () => {
    marketSessionProvider.getMarketStatus.mockResolvedValueOnce('OPEN').mockResolvedValueOnce('UNKNOWN');

    await expect(service.checkSessionCoverage()).resolves.toBeUndefined();
  });

  it('deduplicates exchange codes shared by multiple tracked assets', async () => {
    trackedAssetsService.getAllTrackedAssetsWithExchange.mockResolvedValue([
      { assetId: 'asset-1', exchangeCode: 'XNAS' },
      { assetId: 'asset-2', exchangeCode: 'XNAS' },
    ]);
    marketSessionProvider.getMarketStatus.mockResolvedValue('OPEN');

    await service.checkSessionCoverage();

    expect(marketSessionProvider.getMarketStatus).toHaveBeenCalledTimes(1);
  });
});
