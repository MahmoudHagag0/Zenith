import { dedupeNewsItems, normalizeFinnhubNewsItem, normalizeFmpEvent, normalizeMarketAuxNewsItem } from './calendar-news.normalize';
import type { ProviderNewsItem } from './calendar-news-provider.interface';

describe('calendar-news.normalize', () => {
  describe('normalizeFmpEvent', () => {
    it('maps an FMP economic calendar row into a ProviderCalendarEvent', () => {
      const event = normalizeFmpEvent({ date: '2026-08-01 12:30:00', event: 'Nonfarm Payrolls', country: 'US', impact: 'High' });

      expect(event).toEqual({
        title: 'Nonfarm Payrolls',
        category: 'ECONOMIC',
        importance: 'HIGH',
        description: 'Scheduled economic release for US: Nonfarm Payrolls.',
        scheduledAt: new Date('2026-08-01 12:30:00'),
      });
    });

    it('defaults importance to LOW for an unrecognized or missing impact value', () => {
      const event = normalizeFmpEvent({ date: '2026-08-01 12:30:00', event: 'Minor Release', impact: null });

      expect(event?.importance).toBe('LOW');
    });

    it('returns null for an unparseable date rather than persisting a nonsensical timestamp', () => {
      const event = normalizeFmpEvent({ date: 'not-a-date', event: 'Broken Row' });

      expect(event).toBeNull();
    });
  });

  describe('normalizeFinnhubNewsItem', () => {
    it('maps a Finnhub news row into a ProviderNewsItem', () => {
      const item = normalizeFinnhubNewsItem({ headline: 'Company beats earnings', datetime: 1_785_000_000, source: 'Reuters', summary: 'Details.' });

      expect(item).toEqual({
        headline: 'Company beats earnings',
        summary: 'Details.',
        category: 'MARKET',
        source: 'Reuters',
        publishedAt: new Date(1_785_000_000 * 1000),
      });
    });

    it('returns null when datetime is not a finite epoch value', () => {
      const item = normalizeFinnhubNewsItem({ headline: 'Broken row', datetime: Number.NaN });

      expect(item).toBeNull();
    });
  });

  describe('normalizeMarketAuxNewsItem', () => {
    it('maps a MarketAux news row into a ProviderNewsItem, preferring description over snippet', () => {
      const item = normalizeMarketAuxNewsItem({
        title: 'Sector-wide rally continues',
        published_at: '2026-08-01T10:00:00.000000Z',
        source: 'MarketAux Wire',
        description: 'Full description.',
        snippet: 'Short snippet.',
      });

      expect(item).toEqual({
        headline: 'Sector-wide rally continues',
        summary: 'Full description.',
        category: 'MARKET',
        source: 'MarketAux Wire',
        publishedAt: new Date('2026-08-01T10:00:00.000000Z'),
      });
    });

    it('returns null for an unparseable published_at timestamp', () => {
      const item = normalizeMarketAuxNewsItem({ title: 'Broken row', published_at: 'not-a-timestamp' });

      expect(item).toBeNull();
    });
  });

  describe('dedupeNewsItems', () => {
    function item(headline: string, source: string): ProviderNewsItem {
      return { headline, summary: '', category: 'MARKET', source, publishedAt: new Date('2026-08-01T00:00:00Z') };
    }

    it('keeps the first occurrence of a headline and drops later duplicates regardless of casing/whitespace', () => {
      const result = dedupeNewsItems([item('Company beats earnings', 'Finnhub'), item('  COMPANY   beats   earnings  ', 'MarketAux')]);

      expect(result).toEqual([item('Company beats earnings', 'Finnhub')]);
    });

    it('preserves distinct headlines and their original order', () => {
      const result = dedupeNewsItems([item('Headline A', 'Finnhub'), item('Headline B', 'MarketAux')]);

      expect(result.map((i) => i.headline)).toEqual(['Headline A', 'Headline B']);
    });
  });
});
