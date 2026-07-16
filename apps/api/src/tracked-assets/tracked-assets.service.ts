import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface TrackedInstrument {
  readonly assetId: string;
  readonly symbol: string;
  readonly marketName: string;
}

/**
 * Single source of truth for "what assets does X track" (Foundation
 * Acceptance Review, Medium #3) -- previously three separate, drifting
 * implementations across DashboardService, CalendarNewsService, and
 * MarketDataSyncService. Each method below preserves the exact behavior
 * its original call site already had: the per-user variants exclude
 * Favourites, the global variant used by background sync includes them.
 * Consolidation unifies the implementation, not the product behavior.
 */
@Injectable()
export class TrackedAssetsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Union of one user's Watchlist items (all Watchlists) and open Positions (all Portfolios), deduplicated by assetId, with symbol/market for display. Used by DashboardService. */
  async getTrackedInstrumentsForUser(userId: string): Promise<TrackedInstrument[]> {
    const [watchlistItems, openPositions] = await Promise.all([
      this.prisma.watchlistItem.findMany({
        where: { watchlist: { userId } },
        include: { asset: { include: { market: true } } },
      }),
      this.prisma.position.findMany({
        where: { portfolio: { userId }, quantity: { gt: 0 } },
        include: { asset: { include: { market: true } } },
      }),
    ]);

    const byAssetId = new Map<string, TrackedInstrument>();
    for (const item of [...watchlistItems, ...openPositions]) {
      if (!byAssetId.has(item.asset.id)) {
        byAssetId.set(item.asset.id, { assetId: item.asset.id, symbol: item.asset.symbol, marketName: item.asset.market.name });
      }
    }
    return [...byAssetId.values()];
  }

  /** Same union as getTrackedInstrumentsForUser, assetId only (no asset/market join). Used by CalendarNewsService. */
  async getTrackedAssetIdsForUser(userId: string): Promise<string[]> {
    const [watchlistRows, positionRows] = await Promise.all([
      this.prisma.watchlistItem.findMany({ where: { watchlist: { userId } }, select: { assetId: true }, distinct: ['assetId'] }),
      this.prisma.position.findMany({
        where: { portfolio: { userId }, quantity: { gt: 0 } },
        select: { assetId: true },
        distinct: ['assetId'],
      }),
    ]);
    const assetIds = new Set<string>();
    for (const row of watchlistRows) assetIds.add(row.assetId);
    for (const row of positionRows) assetIds.add(row.assetId);
    return Array.from(assetIds);
  }

  /** Global union across ALL users of Watchlist items, Favourites, and open Positions, deduplicated -- used by background sync jobs warming shared caches (MarketQuote/NewsItem/CotReport), never scoped to one user. Used by MarketDataSyncService. */
  async getAllTrackedAssetIds(): Promise<string[]> {
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
