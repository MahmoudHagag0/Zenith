import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { TrackedAssetsService } from '../tracked-assets/tracked-assets.service';
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
    private readonly trackedAssetsService: TrackedAssetsService,
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
    const assetIds = await this.trackedAssetsService.getTrackedAssetIdsForUser(userId);
    if (assetIds.length === 0) return [];
    return this.prisma.newsItem.findMany({ where: { assetId: { in: assetIds } }, orderBy: { publishedAt: 'desc' }, take: 50 });
  }

  async getUpcomingEventsForTrackedAssets(userId: string) {
    const assetIds = await this.trackedAssetsService.getTrackedAssetIdsForUser(userId);
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
    await Promise.all(
      items.map((item) =>
        // Upserts against a real natural key (assetId, headline, publishedAt)
        // -- the provider is deterministic per day-bucket, so this is safe
        // under concurrent requests populating the same uncached asset,
        // unlike the findFirst-then-create guard this replaced.
        this.prisma.newsItem.upsert({
          where: { assetId_headline_publishedAt: { assetId, headline: item.headline, publishedAt: item.publishedAt } },
          create: {
            assetId,
            headline: item.headline,
            summary: item.summary,
            category: item.category,
            source: item.source,
            publishedAt: item.publishedAt,
          },
          update: {},
        }),
      ),
    );
  }

  private async ensureEventsCached(assetId: string, symbol: string): Promise<void> {
    const events = await this.provider.getUpcomingEvents(symbol);
    await Promise.all(
      events.map((event) =>
        this.prisma.calendarEvent.upsert({
          where: { assetId_title_scheduledAt: { assetId, title: event.title, scheduledAt: event.scheduledAt } },
          create: {
            assetId,
            title: event.title,
            category: event.category,
            importance: event.importance,
            description: event.description,
            scheduledAt: event.scheduledAt,
          },
          update: {},
        }),
      ),
    );
  }
}
