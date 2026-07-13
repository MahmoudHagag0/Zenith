import { Prisma } from '@zenith/database';
import type { MarketSeries, MarketSeriesPoint } from '../../market-series/market-series.types';
import type { Swing, StructureEvent, SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { ComputationOutput } from '../../indicator-engine/indicator-engine.types';

/**
 * Shared fixture builders for every `ict-smc/*.spec.ts` file. Not itself a
 * spec file (no `.spec.ts` suffix, no `describe`/`it`) — plain fixture
 * data, imported freely without re-registering any test.
 */

export function point(dayOffset: number, ohlc: { open: number; high: number; low: number; close: number }): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(ohlc.open),
    high: new Prisma.Decimal(ohlc.high),
    low: new Prisma.Decimal(ohlc.low),
    close: new Prisma.Decimal(ohlc.close),
    volume: new Prisma.Decimal(1000),
    dataQuality: { kind: 'historical', completeness: 'PRESENT' },
  };
}

export function swing(type: 'HIGH' | 'LOW', price: number, dayOffset: number, classification: Swing['classification'] = null): Swing {
  return { timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)), type, price: new Prisma.Decimal(price), classification };
}

export function bosEvent(direction: 'BULLISH' | 'BEARISH', bosSwing: Swing): StructureEvent {
  return {
    timestamp: bosSwing.timestamp,
    type: 'BOS',
    direction,
    trendBefore: direction === 'BULLISH' ? 'UP' : 'DOWN',
    trendAfter: direction === 'BULLISH' ? 'UP' : 'DOWN',
    swing: bosSwing,
  };
}

export function buildSwingResult(swings: Swing[], structureEvents: StructureEvent[]): SwingDetectionResult {
  return {
    sensitivity: 3,
    swings,
    structureEvents,
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

export function buildAtrOutput(value: number): ComputationOutput<Prisma.Decimal> {
  return {
    series: [{ timestamp: new Date(), value: new Prisma.Decimal(value) }],
    metadata: {
      computation: 'ATR',
      parameters: { period: 14 },
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
