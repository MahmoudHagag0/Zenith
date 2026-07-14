import { Prisma } from '@zenith/database';
import { detectWyckoffRange } from './wyckoff-range.detector';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { Swing, SwingDetectionResult } from '../../swing-detection/swing-detection.types';

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

function swing(type: 'HIGH' | 'LOW', price: number, dayOffset: number): Swing {
  return { timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)), type, price: new Prisma.Decimal(price), classification: null };
}

function swingResult(swings: Swing[]): SwingDetectionResult {
  return { sensitivity: 2, swings, structureEvents: [], currentTrend: 'UNKNOWN', metadata: {} as never };
}

describe('detectWyckoffRange (WP2)', () => {
  const points = Array.from({ length: 10 }, (_, i) => point(100 + (i % 2 === 0 ? -2 : 2), i));

  it('identifies a range from the earliest swing highs/lows', () => {
    const swings = [swing('LOW', 95, 1), swing('HIGH', 105, 2), swing('LOW', 96, 4), swing('HIGH', 104, 6)];
    const result = detectWyckoffRange(points, swingResult(swings));
    expect(result).not.toBeNull();
    expect(result!.support.toNumber()).toBe(95);
    expect(result!.resistance.toNumber()).toBe(105);
    expect(result!.startTimestamp).toEqual(swings[0].timestamp);
    expect(result!.endTimestamp).toEqual(points[points.length - 1].timestamp);
  });

  it('is not gated on regime trendState -- a range can be identified purely from swing structure, regardless of the broader trend read', () => {
    // Deliberately does not pass or check any RegimeContextResult here:
    // a genuine Wyckoff range commonly forms near the tail of a longer
    // trend, before a lagging ADX-based regime read catches up. Whether
    // this is identified as a range depends only on swing structure.
    const swings = [swing('LOW', 95, 1), swing('HIGH', 105, 2), swing('LOW', 96, 4), swing('HIGH', 104, 6)];
    const result = detectWyckoffRange(points, swingResult(swings));
    expect(result).not.toBeNull();
  });

  it('returns null when there are fewer than two swing highs or lows', () => {
    const swings = [swing('LOW', 95, 1), swing('HIGH', 105, 2)];
    const result = detectWyckoffRange(points, swingResult(swings));
    expect(result).toBeNull();
  });

  it('derives support/resistance from only the earliest swings, not the series-wide extremes (Spring/SOS must remain able to exceed the range)', () => {
    const swings = [
      swing('LOW', 95, 1), // establishing low
      swing('HIGH', 105, 2), // establishing high
      swing('LOW', 96, 4),
      swing('HIGH', 104, 6),
      swing('LOW', 90, 8), // a later, lower low (e.g. a Spring) -- must NOT redefine support
      swing('HIGH', 110, 9), // a later, higher high (e.g. SOS) -- must NOT redefine resistance
    ];
    const result = detectWyckoffRange(points, swingResult(swings));
    expect(result!.support.toNumber()).toBe(95);
    expect(result!.resistance.toNumber()).toBe(105);
  });
});
