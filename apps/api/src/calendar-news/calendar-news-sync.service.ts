import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AssetsService } from '../assets/assets.service';
import { MarketDataSyncService } from '../market-data/market-data-sync.service';
import { LiveDataObservabilityService } from '../monitoring/live-data-observability.service';
import { CalendarNewsService } from './calendar-news.service';

/**
 * Periodically refreshes cached news/events for assets a trader actually
 * tracks, reusing MarketDataSyncService.getTrackedAssetIds() (S1-005)
 * instead of re-deriving the same Watchlist/Position union query. Runs
 * less often than the quote sync since news/events change far less
 * frequently than price.
 */
@Injectable()
export class CalendarNewsSyncService {
  private readonly logger = new Logger(CalendarNewsSyncService.name);

  constructor(
    private readonly calendarNewsService: CalendarNewsService,
    private readonly marketDataSyncService: MarketDataSyncService,
    private readonly assetsService: AssetsService,
    private readonly liveDataObservabilityService: LiveDataObservabilityService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncTrackedAssets(): Promise<void> {
    const assetIds = await this.marketDataSyncService.getTrackedAssetIds();
    let succeeded = 0;
    let failed = 0;

    for (const assetId of assetIds) {
      try {
        const asset = await this.assetsService.findOne(assetId);
        await this.calendarNewsService.syncAsset(asset.id, asset.symbol);
        succeeded += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(`Calendar/News sync failed for asset ${assetId}: ${(error as Error).message}`);
      }
    }

    this.liveDataObservabilityService.recordSync('calendar-news', succeeded, failed);
    this.logger.log(`Calendar/News sync finished: ${succeeded} succeeded, ${failed} failed, ${assetIds.length} tracked`);
  }
}
