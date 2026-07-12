import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
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
    private readonly prisma: PrismaService,
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

  async getTrackedAssetIds(): Promise<string[]> {
    const [watchlistRows, favouriteRows, positionRows] = await Promise.all([
      this.prisma.watchlistItem.findMany({ select: { assetId: true }, distinct: ['assetId'] }),
      this.prisma.favouriteAsset.findMany({ select: { assetId: true }, distinct: ['assetId'] }),
      this.prisma.position.findMany({
        where: { quantity: { gt: 0 } },
        select: { assetId: true },
        distinct: ['assetId'],
      }),
    ]);

    const assetIds = new Set<string>();
    for (const row of watchlistRows) assetIds.add(row.assetId);
    for (const row of favouriteRows) assetIds.add(row.assetId);
    for (const row of positionRows) assetIds.add(row.assetId);
    return Array.from(assetIds);
  }
}
