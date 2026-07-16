import { Test, TestingModule } from '@nestjs/testing';
import { CalendarNewsSyncService } from './calendar-news-sync.service';
import { CalendarNewsService } from './calendar-news.service';
import { MarketDataSyncService } from '../market-data/market-data-sync.service';
import { AssetsService } from '../assets/assets.service';

describe('CalendarNewsSyncService', () => {
  let service: CalendarNewsSyncService;
  let calendarNewsService: { syncAsset: jest.Mock };
  let marketDataSyncService: { getTrackedAssetIds: jest.Mock };
  let assetsService: { findOne: jest.Mock };

  beforeEach(async () => {
    calendarNewsService = { syncAsset: jest.fn().mockResolvedValue(undefined) };
    marketDataSyncService = { getTrackedAssetIds: jest.fn().mockResolvedValue(['asset-1', 'asset-2']) };
    assetsService = { findOne: jest.fn().mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarNewsSyncService,
        { provide: CalendarNewsService, useValue: calendarNewsService },
        { provide: MarketDataSyncService, useValue: marketDataSyncService },
        { provide: AssetsService, useValue: assetsService },
      ],
    }).compile();

    service = module.get<CalendarNewsSyncService>(CalendarNewsSyncService);
  });

  it('reuses MarketDataSyncService.getTrackedAssetIds() rather than re-deriving the tracked set', async () => {
    await service.syncTrackedAssets();

    expect(marketDataSyncService.getTrackedAssetIds).toHaveBeenCalledTimes(1);
    expect(calendarNewsService.syncAsset).toHaveBeenCalledTimes(2);
  });

  it('tolerates a single asset failing without aborting the batch', async () => {
    assetsService.findOne.mockResolvedValueOnce({ id: 'asset-1', symbol: 'ZEN' }).mockRejectedValueOnce(new Error('not found'));

    await expect(service.syncTrackedAssets()).resolves.toBeUndefined();

    expect(calendarNewsService.syncAsset).toHaveBeenCalledTimes(1);
  });
});
