import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AssetsService } from '../assets/assets.service';
import { MarketDataSyncService } from '../market-data/market-data-sync.service';
import { CorporateActionsService } from './corporate-actions.service';

/**
 * Daily refresh of cached Corporate Actions for assets a trader actually
 * tracks, reusing MarketDataSyncService.getTrackedAssetIds() (S1-005)
 * exactly like CotSyncService/CalendarNewsSyncService do. Daily matches
 * the Blueprint's own stated sync frequency for this domain (§9 Phase 6
 * SLA/Freshness Matrix: "Daily").
 */
@Injectable()
export class CorporateActionsSyncService {
  private readonly logger = new Logger(CorporateActionsSyncService.name);

  constructor(
    private readonly corporateActionsService: CorporateActionsService,
    private readonly marketDataSyncService: MarketDataSyncService,
    private readonly assetsService: AssetsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncTrackedAssets(): Promise<void> {
    const assetIds = await this.marketDataSyncService.getTrackedAssetIds();
    let succeeded = 0;
    let failed = 0;

    for (const assetId of assetIds) {
      try {
        const asset = await this.assetsService.findOne(assetId);
        await this.corporateActionsService.syncAsset(asset.id, asset.symbol);
        succeeded += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(`Corporate Actions sync failed for asset ${assetId}: ${(error as Error).message}`);
      }
    }

    this.logger.log(`Corporate Actions sync finished: ${succeeded} succeeded, ${failed} failed, ${assetIds.length} tracked`);
  }
}
