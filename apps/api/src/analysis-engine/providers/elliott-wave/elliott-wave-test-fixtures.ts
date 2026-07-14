import { Prisma } from '@zenith/database';
import type { MarketSeries, MarketSeriesPoint } from '../../market-series/market-series.types';
import type { Swing, SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';

/**
 * Shared fixture builders for every `elliott-wave/*.spec.ts` file. Not
 * itself a spec file (no `.spec.ts` suffix, no `describe`/`it`) — plain
 * fixture data, imported freely without re-registering any test.
 */

export function point(dayOffset: number, price: number): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(price),
    high: new Prisma.Decimal(price),
    low: new Prisma.Decimal(price),
    close: new Prisma.Decimal(price),
    volume: new Prisma.Decimal(1000),
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

export function buildFibonacciOutput(anchorStart: Prisma.Decimal, anchorEnd: Prisma.Decimal) {
  const range = anchorEnd.minus(anchorStart);
  const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];
  return {
    levels: ratios.map((ratio) => ({ ratio, price: anchorEnd.minus(range.times(ratio)), isTrueFibonacciRatio: ratio !== 0.5 })),
    metadata: {
      computation: 'Fibonacci',
      parameters: { anchorStart: anchorStart.toString(), anchorEnd: anchorEnd.toString() },
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

