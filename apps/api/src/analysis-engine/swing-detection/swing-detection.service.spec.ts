import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { SwingDetectionService } from './swing-detection.service';
import { ComputationCacheService } from '../common/computation-cache.service';
import { ObservabilityService } from '../common/observability.service';
import { ComputationRejectedError } from '../common/computation-rejected.error';
import type { MarketSeries, MarketSeriesPoint } from '../market-series/market-series.types';

function bar(value: number, dayOffset: number): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(value),
    high: new Prisma.Decimal(value),
    low: new Prisma.Decimal(value),
    close: new Prisma.Decimal(value),
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

/**
 * Hand-designed zigzag (sensitivity=1), each bar's high=low=close=value:
 *   values: [5, 10, 6, 12, 7, 14, 4, 13, 9]  (indices 0-8)
 *
 * Detected swings (each requires a strictly higher/lower neighbor on
 * both sides):
 *   idx1=10 HIGH (10>5, 10>6)
 *   idx2=6  LOW  (6<10, 6<12)
 *   idx3=12 HIGH (12>6, 12>7)
 *   idx4=7  LOW  (7<12, 7<14)
 *   idx5=14 HIGH (14>7, 14>4)
 *   idx6=4  LOW  (4<14, 4<13)
 *   idx7=13 HIGH (13>4, 13>9)
 *
 * Classification / trend trace:
 *   idx1 HIGH: first high -> null, trend UNKNOWN
 *   idx2 LOW:  first low -> null, trend UNKNOWN
 *   idx3 HIGH: 12>10 -> HH, trend UNKNOWN -> UP (no event)
 *   idx4 LOW:  7>6 -> HL, trend UP -> no event
 *   idx5 HIGH: 14>12 -> HH, trend UP -> BOS (bullish)
 *   idx6 LOW:  4<7 -> LL, trend UP -> CHoCH (bearish), trend -> DOWN
 *   idx7 HIGH: 13<14 -> LH, trend DOWN -> no event
 *   final trend: DOWN
 */
describe('SwingDetectionService', () => {
  let service: SwingDetectionService;
  const values = [5, 10, 6, 12, 7, 14, 4, 13, 9];
  const points = values.map((v, i) => bar(v, i));
  const fullSeries = series('asset-1', points);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwingDetectionService, ComputationCacheService, ObservabilityService],
    }).compile();
    service = module.get(SwingDetectionService);
  });

  it('detects the hand-designed swing sequence exactly', () => {
    const result = service.detect(fullSeries, { sensitivity: 1 });
    expect(result.swings.map((s) => ({ type: s.type, price: s.price.toNumber(), classification: s.classification }))).toEqual([
      { type: 'HIGH', price: 10, classification: null },
      { type: 'LOW', price: 6, classification: null },
      { type: 'HIGH', price: 12, classification: 'HH' },
      { type: 'LOW', price: 7, classification: 'HL' },
      { type: 'HIGH', price: 14, classification: 'HH' },
      { type: 'LOW', price: 4, classification: 'LL' },
      { type: 'HIGH', price: 13, classification: 'LH' },
    ]);
  });

  it('emits exactly one BOS (bullish continuation) and one CHoCH (bearish reversal), ending in a DOWN trend', () => {
    const result = service.detect(fullSeries, { sensitivity: 1 });
    expect(result.structureEvents).toHaveLength(2);
    expect(result.structureEvents[0]).toMatchObject({ type: 'BOS', direction: 'BULLISH', trendBefore: 'UP', trendAfter: 'UP' });
    expect(result.structureEvents[0].swing.price.toNumber()).toBe(14);
    expect(result.structureEvents[1]).toMatchObject({ type: 'CHoCH', direction: 'BEARISH', trendBefore: 'UP', trendAfter: 'DOWN' });
    expect(result.structureEvents[1].swing.price.toNumber()).toBe(4);
    expect(result.currentTrend).toBe('DOWN');
  });

  it('is point-in-time safe: truncating the input never changes an already-confirmed swing\'s classification', () => {
    // Only through idx6 (one bar short of confirming idx7 as HIGH, since
    // sensitivity=1 needs a bar after it) -- idx7 must not appear yet.
    const truncated = series('asset-1', points.slice(0, 8)); // idx0..idx7, idx7 has no right neighbor
    const result = service.detect(truncated, { sensitivity: 1 });
    expect(result.swings.some((s) => s.price.toNumber() === 13)).toBe(false);

    const full = service.detect(fullSeries, { sensitivity: 1 });
    const commonPrices = result.swings.map((s) => s.price.toNumber());
    const fullCommonSwings = full.swings.filter((s) => commonPrices.includes(s.price.toNumber()));
    expect(fullCommonSwings.map((s) => s.classification)).toEqual(result.swings.map((s) => s.classification));
  });

  it('rejects a non-positive sensitivity', () => {
    expect(() => service.detect(fullSeries, { sensitivity: 0 })).toThrow(ComputationRejectedError);
  });

  it('rejects insufficient points for the given sensitivity', () => {
    expect(() => service.detect(series('asset-1', points.slice(0, 2)), { sensitivity: 2 })).toThrow(ComputationRejectedError);
  });

  it('serves an identical repeated call from cache', () => {
    const first = service.detect(fullSeries, { sensitivity: 1 });
    const second = service.detect(fullSeries, { sensitivity: 1 });
    expect(second).toBe(first);
  });

  it('includes computation metadata with the disclosed sensitivity and computationVersion', () => {
    const result = service.detect(fullSeries, { sensitivity: 1 });
    expect(result.metadata.parameters).toEqual({ sensitivity: 1 });
    expect(result.metadata.computationVersion).toBe('1.0.0');
  });

  it('propagates Data Quality (completeness) from the MarketSeries into computation metadata', () => {
    const complete = service.detect(fullSeries, { sensitivity: 1 });
    expect(complete.metadata.dataQuality).toEqual({ completeness: 'COMPLETE', missingDateCount: 0 });

    const withGaps = service.detect(series('asset-1', points, ['2026-01-05']), { sensitivity: 1 });
    expect(withGaps.metadata.dataQuality).toEqual({ completeness: 'GAPS_PRESENT', missingDateCount: 1 });
  });
});
