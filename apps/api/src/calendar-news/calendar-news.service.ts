import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { CALENDAR_NEWS_PROVIDER, type CalendarNewsProvider } from './providers/calendar-news-provider.interface';

const NEWS_FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Calendar/News caching layer (S1-031, Phase 3 of the post-S1-024 roadmap).
 * Not user-owned -- mirrors MarketQuote/Candle (S1-005): a shared cache
 * keyed by asset, populated on demand and by CalendarNewsSyncService.
 */
@Injectable()
export class CalendarNewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetsService: AssetsService,
    @Inject(CALENDAR_NEWS_PROVIDER) private readonly provider: CalendarNewsProvider,
  ) {}

  async getNewsForAsset(assetId: string) {
    const asset = await this.assetsService.findOne(assetId);
    await this.ensureNewsCached(asset.id, asset.symbol);
    return this.prisma.newsItem.findMany({ where: { assetId }, orderBy: { publishedAt: 'desc' }, take: 20 });
  }

  async getUpcomingEventsForAsset(assetId: string) {
    const asset = await this.assetsService.findOne(assetId);
    await this.ensureEventsCached(asset.id, asset.symbol);
    return this.prisma.calendarEvent.findMany({
      where: { assetId, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getNewsForTrackedAssets(userId: string) {
    const assetIds = await this.gatherTrackedAssetIds(userId);
    if (assetIds.length === 0) return [];
    return this.prisma.newsItem.findMany({ where: { assetId: { in: assetIds } }, orderBy: { publishedAt: 'desc' }, take: 50 });
  }

  async getUpcomingEventsForTrackedAssets(userId: string) {
    const assetIds = await this.gatherTrackedAssetIds(userId);
    if (assetIds.length === 0) return [];
    return this.prisma.calendarEvent.findMany({
      where: { assetId: { in: assetIds }, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /** Used by CalendarNewsSyncService -- populates both caches for one already-resolved asset. */
  async syncAsset(assetId: string, symbol: string): Promise<void> {
    await this.ensureNewsCached(assetId, symbol);
    await this.ensureEventsCached(assetId, symbol);
  }

  private async ensureNewsCached(assetId: string, symbol: string): Promise<void> {
    const since = new Date(Date.now() - NEWS_FRESHNESS_WINDOW_MS);
    const recentCount = await this.prisma.newsItem.count({ where: { assetId, createdAt: { gte: since } } });
    if (recentCount > 0) return;

    const items = await this.provider.getNews(symbol);
    for (const item of items) {
      // Idempotent guard (matching seed.js's own convention) instead of a
      // composite unique constraint -- the provider is deterministic per
      // day-bucket, so a duplicate headline+publishedAt pair for the same
      // asset means this exact item was already cached.
      const exists = await this.prisma.newsItem.findFirst({
        where: { assetId, headline: item.headline, publishedAt: item.publishedAt },
      });
      if (exists) continue;
      await this.prisma.newsItem.create({
        data: {
          assetId,
          headline: item.headline,
          summary: item.summary,
          category: item.category,
          source: item.source,
          publishedAt: item.publishedAt,
        },
      });
    }
  }

  private async ensureEventsCached(assetId: string, symbol: string): Promise<void> {
    const events = await this.provider.getUpcomingEvents(symbol);
    for (const event of events) {
      const exists = await this.prisma.calendarEvent.findFirst({
        where: { assetId, title: event.title, scheduledAt: event.scheduledAt },
      });
      if (exists) continue;
      await this.prisma.calendarEvent.create({
        data: {
          assetId,
          title: event.title,
          category: event.category,
          importance: event.importance,
          description: event.description,
          scheduledAt: event.scheduledAt,
        },
      });
    }
  }

  /** Union of Watchlist items and open Positions for one user, mirroring DashboardService's own gatherTrackedInstruments (S1-019). */
  private async gatherTrackedAssetIds(userId: string): Promise<string[]> {
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
}
