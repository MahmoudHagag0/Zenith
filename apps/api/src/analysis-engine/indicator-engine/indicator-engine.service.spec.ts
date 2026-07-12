import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { IndicatorEngineService } from './indicator-engine.service';
import { ComputationCacheService } from '../common/computation-cache.service';
import { ObservabilityService } from '../common/observability.service';
import type { MarketSeries, MarketSeriesPoint } from '../market-series/market-series.types';

function point(close: number, dayOffset: number): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(close),
    high: new Prisma.Decimal(close),
    low: new Prisma.Decimal(close),
    close: new Prisma.Decimal(close),
    volume: new Prisma.Decimal(1000),
    dataQuality: { kind: 'historical', completeness: 'PRESENT' },
  };
}

function series(assetId: string, points: MarketSeriesPoint[], missingDates: string[] = []): MarketSeries {
  return {
    assetId,
    requestedRange: { from: points[0].timestamp, to: points[points.length - 1].timestamp },
    points,
    missingDates,
    currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
  };
}

describe('IndicatorEngineService', () => {
  let service: IndicatorEngineService;
  let cache: ComputationCacheService;
  let observability: ObservabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IndicatorEngineService, ComputationCacheService, ObservabilityService],
    }).compile();

    service = module.get(IndicatorEngineService);
    cache = module.get(ComputationCacheService);
    observability = module.get(ObservabilityService);
  });

  const points = [10, 12, 11, 13, 12].map((c, i) => point(c, i));
  const oneSeries = series('asset-1', points);

  it('computes SMA correctly through the registry', () => {
    const result = service.sma(oneSeries, { period: 3 });
    expect(result.series[0].value.toNumber()).toBe(11);
  });

  it('serves an identical repeated call from cache without recomputation', () => {
    const first = service.sma(oneSeries, { period: 3 });
    const statsAfterFirst = cache.getStats();
    const second = service.sma(oneSeries, { period: 3 });
    const statsAfterSecond = cache.getStats();

    expect(second).toBe(first); // same cached object reference
    expect(statsAfterSecond.hits).toBe(statsAfterFirst.hits + 1);
  });

  it('bypasses the cache when parameters differ', () => {
    const period3 = service.sma(oneSeries, { period: 3 });
    const period2 = service.sma(oneSeries, { period: 2 });
    expect(period3).not.toBe(period2);
    expect(period3.metadata.parameters).toEqual({ period: 3 });
    expect(period2.metadata.parameters).toEqual({ period: 2 });
  });

  it('bypasses the cache when the instrument (assetId) differs, even with identical points/parameters', () => {
    const assetA = service.sma(series('asset-A', points), { period: 3 });
    const assetB = service.sma(series('asset-B', points), { period: 3 });
    expect(assetA).not.toBe(assetB);
  });

  it('records a rejection via ObservabilityService when input is insufficient, without caching it', () => {
    expect(() => service.sma(series('asset-1', points.slice(0, 1)), { period: 3 })).toThrow();
    const stats = observability.getStats('SMA');
    expect(stats.rejectionRate).toBeGreaterThan(0);
  });

  it('computes RSI, MACD, Bollinger Bands, ATR, ADX, and Donchian Channel through the registry', () => {
    const longer = series('asset-1', Array.from({ length: 12 }, (_, i) => point(10 + (i % 4), i)));
    expect(() => service.rsi(longer, { period: 3 })).not.toThrow();
    expect(() => service.macd(longer, { fastPeriod: 2, slowPeriod: 4, signalPeriod: 2 })).not.toThrow();
    expect(() => service.bollingerBands(longer, { period: 3, stdDevMultiplier: 2 })).not.toThrow();
    expect(() => service.atr(longer, { period: 3 })).not.toThrow();
    expect(() => service.adx(longer, { period: 3 })).not.toThrow();
    expect(() => service.donchianChannel(longer, { period: 3 })).not.toThrow();
  });

  it('computes Fibonacci levels without requiring a MarketSeries', () => {
    const result = service.fibonacciLevels({ anchorStart: new Prisma.Decimal(100), anchorEnd: new Prisma.Decimal(200) });
    expect(result.levels).toHaveLength(9);
  });

  it('propagates Data Quality (completeness) from the MarketSeries into computation metadata', () => {
    const complete = service.sma(oneSeries, { period: 3 });
    expect(complete.metadata.dataQuality).toEqual({ completeness: 'COMPLETE', missingDateCount: 0 });

    const withGaps = service.sma(series('asset-1', points, ['2026-01-02', '2026-01-03']), { period: 3 });
    expect(withGaps.metadata.dataQuality).toEqual({ completeness: 'GAPS_PRESENT', missingDateCount: 2 });
  });
});
