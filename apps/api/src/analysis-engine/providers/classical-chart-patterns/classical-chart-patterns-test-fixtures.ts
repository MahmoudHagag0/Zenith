import { Prisma } from '@zenith/database';
import type { MarketSeries, MarketSeriesPoint } from '../../market-series/market-series.types';
import type { Swing, SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';

/**
 * Shared fixture builders for every `classical-chart-patterns/*.spec.ts`
 * file. Not itself a spec file (no `.spec.ts` suffix, no
 * `describe`/`it`) -- plain fixture data, imported freely without
 * re-registering any test.
 */

export function point(dayOffset: number, price: number, volume = 1000): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(price),
    high: new Prisma.Decimal(price),
    low: new Prisma.Decimal(price),
    close: new Prisma.Decimal(price),
    volume: new Prisma.Decimal(volume),
    dataQuality: { kind: 'historical', completeness: 'PRESENT' },
  };
}

export function swing(type: 'HIGH' | 'LOW', price: number, dayOffset: number): Swing {
  return { timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)), type, price: new Prisma.Decimal(price), classification: null };
}

export function buildSwingResult(swings: Swing[]): SwingDetectionResult {
  return {
    sensitivity: 3,
    swings,
    structureEvents: [],
    currentTrend: 'UP',
    metadata: {
      computation: 'SwingDetection',
      parameters: { sensitivity: 3 },
      formula: 'test fixture',
      source: 'test fixture',
      inputRange: { from: null, to: null, pointCount: 0 },
      computedAt: new Date().toISOString(),
      computationVersion: '1.0.0',
    },
  };
}

export function buildRegimeResult(trendState: 'TRENDING' | 'RANGING'): RegimeContextResult {
  return {
    trendState,
    trendDirection: 'UP',
    volatilityState: 'LOW',
    adx: new Prisma.Decimal(20),
    atr: new Prisma.Decimal(1),
    atrBaseline: new Prisma.Decimal(1),
    metadata: {
      computation: 'RegimeContext',
      parameters: {},
      formula: 'test fixture',
      source: 'test fixture',
      inputRange: { from: null, to: null, pointCount: 0 },
      computedAt: new Date().toISOString(),
      computationVersion: '1.0.0',
    },
  };
}

export function buildSeries(points: MarketSeriesPoint[]): MarketSeries {
  return {
    assetId: 'asset-1',
    requestedRange: { from: points[0].timestamp, to: points[points.length - 1].timestamp },
    points,
    missingDates: [],
    currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
  };
}

/** A textbook-clean bearish Head and Shoulders: LeftShoulder(100) < Head(110) > RightShoulder(101), neckline troughs at 90/91. */
export function headAndShouldersSwings(): Swing[] {
  return [swing('HIGH', 100, 0), swing('LOW', 90, 1), swing('HIGH', 110, 2), swing('LOW', 91, 3), swing('HIGH', 101, 4)];
}

/** A textbook-clean bearish Double Top: Peak1(100) ~= Peak2(101), trough at 90. */
export function doubleTopSwings(): Swing[] {
  return [swing('HIGH', 100, 0), swing('LOW', 90, 1), swing('HIGH', 101, 2)];
}
