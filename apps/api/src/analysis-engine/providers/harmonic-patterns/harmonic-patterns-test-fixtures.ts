import { Prisma } from '@zenith/database';
import type { MarketSeries, MarketSeriesPoint } from '../../market-series/market-series.types';
import type { Swing, SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';

/**
 * Shared fixture builders for every `harmonic-patterns/*.spec.ts` file.
 * Not itself a spec file (no `.spec.ts` suffix, no `describe`/`it`) --
 * plain fixture data, imported freely without re-registering any test.
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

export function buildRegimeResult(volatilityState: 'LOW' | 'HIGH'): RegimeContextResult {
  return {
    trendState: 'TRENDING',
    trendDirection: 'UP',
    volatilityState,
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

/**
 * Builds a bullish X-A-B-C-D swing sequence (`LOW,HIGH,LOW,HIGH,LOW`)
 * from explicit prices, at one calendar day per swing by default (day
 * offsets `0,1,2,3,4`) -- day offsets may be overridden for time-symmetry
 * (AB vs. CD duration) tests.
 */
export function bullishXabcdSwings(prices: { x: number; a: number; b: number; c: number; d: number }, dayOffsets: [number, number, number, number, number] = [0, 1, 2, 3, 4]): Swing[] {
  return [
    swing('LOW', prices.x, dayOffsets[0]),
    swing('HIGH', prices.a, dayOffsets[1]),
    swing('LOW', prices.b, dayOffsets[2]),
    swing('HIGH', prices.c, dayOffsets[3]),
    swing('LOW', prices.d, dayOffsets[4]),
  ];
}

/** A textbook-clean bullish Gartley: XA=100 (0->100), AB=0.618*XA (B=38.2), BC=0.618*AB (C=76.4), CD completes at AD=0.786*XA (D=21.4). */
export const GARTLEY_BULLISH_PRICES = { x: 0, a: 100, b: 38.2, c: 76.4, d: 21.4 };
