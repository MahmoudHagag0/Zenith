import { Prisma } from '@zenith/database';
import type { MarketSeries, MarketSeriesPoint } from '../../market-series/market-series.types';
import type { IndicatorSeriesEntry } from '../../indicator-engine/indicator-engine.types';
import type { Swing, SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult, VolatilityState } from '../../regime-context/regime-context.types';

/**
 * Shared fixture builders for every `price-action/*.spec.ts` file. Not
 * itself a spec file (no `.spec.ts` suffix, no `describe`/`it`) -- plain
 * fixture data, imported freely without re-registering any test.
 */

export interface Ohlc {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

/** A full-OHLC candle -- unlike a flat single-price point, this carries real wicks/bodies so quality-scoring has something genuine to measure. */
export function candle(dayOffset: number, ohlc: Ohlc, volume = 1000): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(ohlc.open),
    high: new Prisma.Decimal(ohlc.high),
    low: new Prisma.Decimal(ohlc.low),
    close: new Prisma.Decimal(ohlc.close),
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

export function buildRegimeResult(trendState: 'TRENDING' | 'RANGING', volatilityState: VolatilityState = 'LOW'): RegimeContextResult {
  return {
    trendState,
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

/** A uniform ATR series covering every given point at the same disclosed value -- sufficient for deterministic ATR-relative test assertions. */
export function buildAtrSeries(points: readonly MarketSeriesPoint[], value: number): readonly IndicatorSeriesEntry<Prisma.Decimal>[] {
  return points.map((point) => ({ timestamp: point.timestamp, value: new Prisma.Decimal(value) }));
}

export function buildAtrResult(points: readonly MarketSeriesPoint[], value: number) {
  return {
    series: buildAtrSeries(points, value),
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
