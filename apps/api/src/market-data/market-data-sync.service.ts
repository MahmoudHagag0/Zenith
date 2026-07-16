import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrackedAssetsService } from '../tracked-assets/tracked-assets.service';
import { MarketDataService } from './market-data.service';
import { MARKET_SESSION_PROVIDER, type MarketSessionProvider } from './providers/market-session-provider.interface';
import type { MarketStatus } from './providers/market-session-provider.interface';

/**
 * Periodically refreshes cached quotes for assets a trader actually tracks
 * (watchlisted, favourited, or held in an open position) — not the entire
 * catalog — per ADR-004/DEC-2026-007. Reuses MarketDataService.getQuote(),
 * so the same TTL cache, rate limiter, and retry logic apply as on-demand
 * reads.
 *
 * As of L1-002, polling is additionally gated on the asset's exchange
 * being open (28_LIVE_DATA_BLUEPRINT.md §6/§9 Phase 2): a confirmed-closed
 * market is skipped. Any other outcome -- OPEN, or UNKNOWN because the
 * exchange has no entry in the Market Sessions table, or the lookup itself
 * throws -- fails open (polls as normal), so a coverage gap degrades to
 * the pre-L1-002 always-poll behavior rather than silently starving
 * Dashboard of fresh quotes (Sprint Brief Objective #5).
 */
@Injectable()
export class MarketDataSyncService {
  private readonly logger = new Logger(MarketDataSyncService.name);

  constructor(
    private readonly trackedAssetsService: TrackedAssetsService,
    private readonly marketDataService: MarketDataService,
    @Inject(MARKET_SESSION_PROVIDER) private readonly marketSessionProvider: MarketSessionProvider,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncTrackedAssets(): Promise<void> {
    const assets = await this.trackedAssetsService.getAllTrackedAssetsWithExchange();
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const { assetId, exchangeCode } of assets) {
      const status = await this.getMarketStatusFailOpen(exchangeCode);
      if (status === 'CLOSED') {
        skipped += 1;
        continue;
      }

      try {
        await this.marketDataService.getQuote(assetId);
        succeeded += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(`Market data sync failed for asset ${assetId}: ${(error as Error).message}`);
      }
    }

    this.logger.log(
      `Market data sync finished: ${succeeded} succeeded, ${failed} failed, ${skipped} skipped (market closed), ${assets.length} tracked`,
    );
  }

  private async getMarketStatusFailOpen(exchangeCode: string): Promise<MarketStatus> {
    try {
      return await this.marketSessionProvider.getMarketStatus(exchangeCode);
    } catch (error) {
      this.logger.warn(`Market session lookup failed for exchange ${exchangeCode}, failing open (will poll): ${(error as Error).message}`);
      return 'UNKNOWN';
    }
  }

  /** Kept as its own public method (CalendarNewsSyncService/CotSyncService already depend on this exact name) -- delegates to the single shared implementation (TrackedAssetsService, Foundation Acceptance Review Medium #3). */
  getTrackedAssetIds(): Promise<string[]> {
    return this.trackedAssetsService.getAllTrackedAssetIds();
  }
}
