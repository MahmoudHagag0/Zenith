import { Test, TestingModule } from '@nestjs/testing';
import { CorporateActionsSyncService } from './corporate-actions-sync.service';
import { CorporateActionsService } from './corporate-actions.service';
import { MarketDataSyncService } from '../market-data/market-data-sync.service';
import { AssetsService } from '../assets/assets.service';

describe('CorporateActionsSyncService', () => {
  let service: CorporateActionsSyncService;
  let corporateActionsService: { syncAsset: jest.Mock };
  let marketDataSyncService: { getTrackedAssetIds: jest.Mock };
  let assetsService: { findOne: jest.Mock };

  beforeEach(async () => {
    corporateActionsService = { syncAsset: jest.fn().mockResolvedValue(undefined) };
    marketDataSyncService = { getTrackedAssetIds: jest.fn().mockResolvedValue(['asset-1', 'asset-2']) };
    assetsService = { findOne: jest.fn().mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorporateActionsSyncService,
        { provide: CorporateActionsService, useValue: corporateActionsService },
        { provide: MarketDataSyncService, useValue: marketDataSyncService },
        { provide: AssetsService, useValue: assetsService },
      ],
    }).compile();

    service = module.get<CorporateActionsSyncService>(CorporateActionsSyncService);
  });

  it('reuses MarketDataSyncService.getTrackedAssetIds() rather than re-deriving the tracked set', async () => {
    await service.syncTrackedAssets();

    expect(marketDataSyncService.getTrackedAssetIds).toHaveBeenCalledTimes(1);
    expect(corporateActionsService.syncAsset).toHaveBeenCalledTimes(2);
  });

  it('tolerates a single asset failing without aborting the batch', async () => {
    assetsService.findOne.mockResolvedValueOnce({ id: 'asset-1', symbol: 'ZEN' }).mockRejectedValueOnce(new Error('not found'));

    await expect(service.syncTrackedAssets()).resolves.toBeUndefined();

    expect(corporateActionsService.syncAsset).toHaveBeenCalledTimes(1);
  });
});
