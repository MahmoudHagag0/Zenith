import { Prisma } from '@zenith/database';
import { detectWyckoffRange } from './wyckoff-range.detector';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { Swing, SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';

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

function regimeResult(trendState: 'RANGING' | 'TRENDING'): RegimeContextResult {
  return {
    trendState,
    trendDirection: 'UNKNOWN',
    volatilityState: 'LOW',
    adx: new Prisma.Decimal(15),
    atr: new Prisma.Decimal(1),
    atrBaseline: new Prisma.Decimal(1),
    metadata: {} as never,
  };
}

describe('detectWyckoffRange (WP2)', () => {
  const points = Array.from({ length: 10 }, (_, i) => point(100 + (i % 2 === 0 ? -2 : 2), i));

  it('identifies a range from swing highs/lows when the regime reads RANGING', () => {
    const swings = [swing('LOW', 95, 1), swing('HIGH', 105, 2), swing('LOW', 96, 4), swing('HIGH', 104, 6)];
    const result = detectWyckoffRange(points, swingResult(swings), regimeResult('RANGING'));
    expect(result).not.toBeNull();
    expect(result!.support.toNumber()).toBe(95);
    expect(result!.resistance.toNumber()).toBe(105);
    expect(result!.startTimestamp).toEqual(swings[0].timestamp);
    expect(result!.endTimestamp).toEqual(points[points.length - 1].timestamp);
  });

  it('returns null when the regime reads TRENDING, even with ample swing structure', () => {
    const swings = [swing('LOW', 95, 1), swing('HIGH', 105, 2), swing('LOW', 96, 4), swing('HIGH', 104, 6)];
    const result = detectWyckoffRange(points, swingResult(swings), regimeResult('TRENDING'));
    expect(result).toBeNull();
  });

  it('returns null when there are fewer than two swing highs or lows', () => {
    const swings = [swing('LOW', 95, 1), swing('HIGH', 105, 2)];
    const result = detectWyckoffRange(points, swingResult(swings), regimeResult('RANGING'));
    expect(result).toBeNull();
  });
});
