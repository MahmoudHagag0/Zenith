import { Injectable } from '@nestjs/common';
import { MarketDataService } from '../../market-data/market-data.service';
import type { CurrentQuoteFreshness, CurrentQuotePoint, MarketSeries, MarketSeriesPoint } from './market-series.types';

// Same threshold as DEC-2026-009 (Analytics layer, S1-006) — a single,
// consistent staleness definition for a live quote across the platform.
const STALE_QUOTE_THRESHOLD_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toUtcDateString(date: Date): string {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

/**
 * The Anti-Corruption Layer's translation adapter (ADR-005,
 * 22_ANALYSIS_ENGINE_ARCHITECTURE.md "Anti-Corruption Layer — Market Data
 * Boundary"). This is the *only* file in the Analysis Engine permitted to
 * handle `Candle`/`MarketQuote`-shaped data (received from
 * `MarketDataService`, never queried directly) — every other Analysis
 * Engine component consumes `MarketSeries` only. Composes
 * `MarketDataService` rather than duplicating its caching, rate-limiting,
 * or retry logic.
 */
@Injectable()
export class MarketSeriesService {
  constructor(private readonly marketDataService: MarketDataService) {}

  async getSeries(assetId: string, from: Date, to: Date): Promise<MarketSeries> {
    const candles = await this.marketDataService.getCandles(assetId, from, to);

    const points: MarketSeriesPoint[] = candles
      .map((candle) => ({
        timestamp: candle.date,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        dataQuality: { kind: 'historical' as const, completeness: 'PRESENT' as const },
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const missingDates = this.computeMissingDates(from, to, points);
    const currentQuote = await this.buildCurrentQuote(assetId);

    return {
      assetId,
      requestedRange: { from, to },
      points,
      missingDates,
      currentQuote,
    };
  }

  private computeMissingDates(from: Date, to: Date, points: readonly MarketSeriesPoint[]): string[] {
    const present = new Set(points.map((p) => toUtcDateString(p.timestamp)));
    const missing: string[] = [];
    const start = startOfUtcDay(from);
    const end = startOfUtcDay(to);
    for (let day = start; day.getTime() <= end.getTime(); day = new Date(day.getTime() + DAY_MS)) {
      const key = toUtcDateString(day);
      if (!present.has(key)) missing.push(key);
    }
    return missing;
  }

  private async buildCurrentQuote(assetId: string): Promise<CurrentQuotePoint> {
    const quote = await this.tryGetQuote(assetId);
    if (!quote) {
      return {
        price: null,
        currency: null,
        asOf: null,
        fetchedAt: null,
        ageSeconds: null,
        dataQuality: { kind: 'current', freshness: 'MISSING' },
      };
    }

    const ageMs = Date.now() - quote.fetchedAt.getTime();
    const freshness: CurrentQuoteFreshness = ageMs > STALE_QUOTE_THRESHOLD_MS ? 'STALE' : 'FRESH';

    return {
      price: quote.price,
      currency: quote.currency,
      asOf: quote.asOf,
      fetchedAt: quote.fetchedAt,
      ageSeconds: Math.round(ageMs / 1000),
      dataQuality: { kind: 'current', freshness },
    };
  }

  private async tryGetQuote(assetId: string) {
    try {
      return await this.marketDataService.getQuote(assetId);
    } catch {
      // Graceful degradation, consistent with the Analytics layer's (S1-006)
      // tryGetQuote precedent: a quote-fetch failure degrades only the
      // current-quote point (MISSING), never the whole series translation.
      return null;
    }
  }
}
