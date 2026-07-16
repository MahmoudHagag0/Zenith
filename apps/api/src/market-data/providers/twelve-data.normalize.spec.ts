import { normalizeCandles, normalizeQuote } from './twelve-data.normalize';
import type { TwelveDataQuote, TwelveDataTimeSeries } from './twelve-data.schemas';

describe('twelve-data.normalize', () => {
  describe('normalizeQuote', () => {
    it('parses the string-encoded close price into a number and preserves currency/symbol', () => {
      const raw: TwelveDataQuote = { symbol: 'AAPL', currency: 'USD', close: '182.52', timestamp: 1_704_135_600 };

      const quote = normalizeQuote('AAPL', raw);

      expect(quote).toEqual({ symbol: 'AAPL', price: 182.52, currency: 'USD', asOf: new Date(1_704_135_600 * 1000) });
    });

    it('falls back to datetime when timestamp is absent', () => {
      const raw: TwelveDataQuote = { symbol: 'EUR/USD', currency: 'USD', close: '1.0950', datetime: '2026-01-01' };

      const quote = normalizeQuote('EUR/USD', raw);

      expect(quote.asOf).toEqual(new Date('2026-01-01'));
    });

    it('falls back to the current time when neither timestamp nor datetime is present', () => {
      const before = Date.now();
      const raw: TwelveDataQuote = { symbol: 'AAPL', currency: 'USD', close: '100.00' };

      const quote = normalizeQuote('AAPL', raw);

      expect(quote.asOf.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  describe('normalizeCandles', () => {
    it('parses string-encoded OHLCV fields into numbers', () => {
      const raw: TwelveDataTimeSeries = {
        meta: { symbol: 'AAPL', currency: 'USD' },
        values: [{ datetime: '2026-01-02', open: '10', high: '12', low: '9', close: '11', volume: '1000' }],
      };

      const candles = normalizeCandles(raw);

      expect(candles).toEqual([
        { date: new Date('2026-01-02'), open: 10, high: 12, low: 9, close: 11, volume: 1000 },
      ]);
    });

    it('reorders Twelve Data\'s most-recent-first values into ascending date order', () => {
      const raw: TwelveDataTimeSeries = {
        meta: { symbol: 'AAPL' },
        values: [
          { datetime: '2026-01-03', open: '1', high: '1', low: '1', close: '1', volume: '1' },
          { datetime: '2026-01-01', open: '1', high: '1', low: '1', close: '1', volume: '1' },
          { datetime: '2026-01-02', open: '1', high: '1', low: '1', close: '1', volume: '1' },
        ],
      };

      const candles = normalizeCandles(raw);

      expect(candles.map((c) => c.date.toISOString().slice(0, 10))).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
    });

    it('returns an empty array when there are no values', () => {
      const raw: TwelveDataTimeSeries = { meta: { symbol: 'AAPL' }, values: [] };

      expect(normalizeCandles(raw)).toEqual([]);
    });
  });
});
