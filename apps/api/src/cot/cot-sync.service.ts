import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AssetsService } from '../assets/assets.service';
import { MarketDataSyncService } from '../market-data/market-data-sync.service';
import { LiveDataObservabilityService } from '../monitoring/live-data-observability.service';
import { CotService } from './cot.service';

/**
 * Weekly refresh of cached COT reports for assets a trader actually tracks,
 * reusing MarketDataSyncService.getTrackedAssetIds() (S1-005) exactly like
 * CalendarNewsSyncService (S1-031) does -- COT reports are published
 * weekly in reality, so a weekly Cron matches the underlying data's own
 * cadence rather than over-polling a source that never changes daily.
 */
@Injectable()
export class CotSyncService {
  private readonly logger = new Logger(CotSyncService.name);

  constructor(
    private readonly cotService: CotService,
    private readonly marketDataSyncService: MarketDataSyncService,
    private readonly assetsService: AssetsService,
    private readonly liveDataObservabilityService: LiveDataObservabilityService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async syncTrackedAssets(): Promise<void> {
    const assetIds = await this.marketDataSyncService.getTrackedAssetIds();
    let succeeded = 0;
    let failed = 0;

    for (const assetId of assetIds) {
      try {
        const asset = await this.assetsService.findOne(assetId);
        await this.cotService.syncAsset(asset.id, asset.symbol);
        succeeded += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(`COT sync failed for asset ${assetId}: ${(error as Error).message}`);
      }
    }

    this.liveDataObservabilityService.recordSync('cot', succeeded, failed);
    this.logger.log(`COT sync finished: ${succeeded} succeeded, ${failed} failed, ${assetIds.length} tracked`);
  }
}
