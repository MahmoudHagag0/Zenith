import { Test, TestingModule } from '@nestjs/testing';
import { CalendarNewsService } from './calendar-news.service';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { CALENDAR_NEWS_PROVIDER } from './providers/calendar-news-provider.interface';

describe('CalendarNewsService', () => {
  let service: CalendarNewsService;
  let prisma: {
    newsItem: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock; count: jest.Mock };
    calendarEvent: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock };
    watchlistItem: { findMany: jest.Mock };
    position: { findMany: jest.Mock };
  };
  let assetsService: { findOne: jest.Mock };
  let provider: { getNews: jest.Mock; getUpcomingEvents: jest.Mock };

  beforeEach(async () => {
    prisma = {
      newsItem: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), count: jest.fn() },
      calendarEvent: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
      watchlistItem: { findMany: jest.fn() },
      position: { findMany: jest.fn() },
    };
    assetsService = { findOne: jest.fn() };
    provider = { getNews: jest.fn(), getUpcomingEvents: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarNewsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AssetsService, useValue: assetsService },
        { provide: CALENDAR_NEWS_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get<CalendarNewsService>(CalendarNewsService);
  });

  it('fetches fresh news from the provider when the cache is empty', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.newsItem.count.mockResolvedValue(0);
    provider.getNews.mockResolvedValue([
      { headline: 'Headline', summary: 'Summary', category: 'MARKET', source: 'Wire', publishedAt: new Date('2026-01-01') },
    ]);
    prisma.newsItem.findFirst.mockResolvedValue(null);
    prisma.newsItem.findMany.mockResolvedValue([{ id: 'news-1' }]);

    const result = await service.getNewsForAsset('asset-1');

    expect(provider.getNews).toHaveBeenCalledWith('ZEN');
    expect(prisma.newsItem.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'news-1' }]);
  });

  it('does not refetch from the provider when the cache is still fresh', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.newsItem.count.mockResolvedValue(3);
    prisma.newsItem.findMany.mockResolvedValue([{ id: 'news-1' }, { id: 'news-2' }, { id: 'news-3' }]);

    await service.getNewsForAsset('asset-1');

    expect(provider.getNews).not.toHaveBeenCalled();
  });

  it('skips creating a news item that already exists (idempotent cache population)', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.newsItem.count.mockResolvedValue(0);
    provider.getNews.mockResolvedValue([
      { headline: 'Headline', summary: 'Summary', category: 'MARKET', source: 'Wire', publishedAt: new Date('2026-01-01') },
    ]);
    prisma.newsItem.findFirst.mockResolvedValue({ id: 'existing' });
    prisma.newsItem.findMany.mockResolvedValue([]);

    await service.getNewsForAsset('asset-1');

    expect(prisma.newsItem.create).not.toHaveBeenCalled();
  });

  it('gathers upcoming events for the union of a user watchlist and open positions, deduplicated', async () => {
    prisma.watchlistItem.findMany.mockResolvedValue([{ assetId: 'asset-1' }]);
    prisma.position.findMany.mockResolvedValue([{ assetId: 'asset-1' }, { assetId: 'asset-2' }]);
    prisma.calendarEvent.findMany.mockResolvedValue([{ id: 'event-1' }]);

    const result = await service.getUpcomingEventsForTrackedAssets('user-1');

    expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ assetId: { in: ['asset-1', 'asset-2'] } }) }),
    );
    expect(result).toEqual([{ id: 'event-1' }]);
  });

  it('returns an empty array for a user with no tracked assets, without querying the cache', async () => {
    prisma.watchlistItem.findMany.mockResolvedValue([]);
    prisma.position.findMany.mockResolvedValue([]);

    const result = await service.getNewsForTrackedAssets('user-1');

    expect(result).toEqual([]);
    expect(prisma.newsItem.findMany).not.toHaveBeenCalled();
  });
});
