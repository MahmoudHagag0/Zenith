import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrackedAssetsService } from '../tracked-assets/tracked-assets.service';
import { MarketDataService } from './market-data.service';

/**
 * Periodically refreshes cached quotes for assets a trader actually tracks
 * (watchlisted, favourited, or held in an open position) — not the entire
 * catalog — per ADR-004/DEC-2026-007. Reuses MarketDataService.getQuote(),
 * so the same TTL cache, rate limiter, and retry logic apply as on-demand
 * reads.
 */
@Injectable()
export class MarketDataSyncService {
  private readonly logger = new Logger(MarketDataSyncService.name);

  constructor(
    private readonly trackedAssetsService: TrackedAssetsService,
    private readonly marketDataService: MarketDataService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncTrackedAssets(): Promise<void> {
    const assetIds = await this.getTrackedAssetIds();
    let succeeded = 0;
    let failed = 0;

    for (const assetId of assetIds) {
      try {
        await this.marketDataService.getQuote(assetId);
        succeeded += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(`Market data sync failed for asset ${assetId}: ${(error as Error).message}`);
      }
    }

    this.logger.log(`Market data sync finished: ${succeeded} succeeded, ${failed} failed, ${assetIds.length} tracked`);
  }

  /** Kept as its own public method (CalendarNewsSyncService/CotSyncService already depend on this exact name) -- delegates to the single shared implementation (TrackedAssetsService, Foundation Acceptance Review Medium #3). */
  getTrackedAssetIds(): Promise<string[]> {
    return this.trackedAssetsService.getAllTrackedAssetIds();
  }
}
