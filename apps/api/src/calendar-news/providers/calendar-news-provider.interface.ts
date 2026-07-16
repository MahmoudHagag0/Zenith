export type ProviderNewsCategory = 'EARNINGS' | 'ECONOMIC' | 'MARKET' | 'COMPANY';
export type ProviderCalendarImportance = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProviderNewsItem {
  headline: string;
  summary: string;
  category: ProviderNewsCategory;
  source: string;
  publishedAt: Date;
}

export interface ProviderCalendarEvent {
  title: string;
  category: ProviderNewsCategory;
  importance: ProviderCalendarImportance;
  description: string;
  scheduledAt: Date;
}

/**
 * Every consumer of Calendar/News data depends on this interface only
 * (mirroring ADR-003's MarketDataProvider) -- never on a concrete provider.
 * As of S1-031 the only registered implementation is
 * SimulatedCalendarNewsProvider; a future real vendor requires only a new
 * implementation and module registration, no change to any consumer.
 */
export interface CalendarNewsProvider {
  readonly name: string;
  getNews(symbol: string): Promise<ProviderNewsItem[]>;
  getUpcomingEvents(symbol: string): Promise<ProviderCalendarEvent[]>;
}

export const CALENDAR_NEWS_PROVIDER = 'CALENDAR_NEWS_PROVIDER';
