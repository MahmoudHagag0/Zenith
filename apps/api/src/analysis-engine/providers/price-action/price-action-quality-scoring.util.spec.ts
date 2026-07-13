import { Prisma } from '@zenith/database';
import { findAtrAtOrBefore, scoreQuality } from './price-action-quality-scoring.util';
import { buildAtrSeries, candle } from './price-action-test-fixtures';
import type { KeyLevel, ReactionClassification } from './price-action.types';

const HIGH_LEVEL: KeyLevel = { type: 'HIGH', price: new Prisma.Decimal(100), timestamp: new Date(Date.UTC(2026, 0, 1)) };

describe('findAtrAtOrBefore', () => {
  it('returns the value at or immediately before the given timestamp', () => {
    const points = [candle(1, { open: 1, high: 1, low: 1, close: 1 }), candle(3, { open: 1, high: 1, low: 1, close: 1 })];
    const series = points.map((p, i) => ({ timestamp: p.timestamp, value: new Prisma.Decimal(i + 1) }));
    expect(findAtrAtOrBefore(series, new Date(Date.UTC(2026, 0, 2)))?.toNumber()).toBe(1);
    expect(findAtrAtOrBefore(series, new Date(Date.UTC(2026, 0, 4)))?.toNumber()).toBe(2);
  });

  it('returns null when no entry exists at or before the timestamp', () => {
    const points = [candle(5, { open: 1, high: 1, low: 1, close: 1 })];
    const series = buildAtrSeries(points, 1);
    expect(findAtrAtOrBefore(series, new Date(Date.UTC(2026, 0, 1)))).toBeNull();
  });
});

describe('scoreQuality', () => {
  it('returns a zero score with no ATR clearance for APPROACHING_LEVEL', () => {
    const classification: ReactionClassification = { state: 'APPROACHING_LEVEL', breakoutPoint: null, retestPoint: null, rejectionPoint: null };
    const result = scoreQuality(classification, HIGH_LEVEL, []);
    expect(result.value).toBe(0);
    expect(result.atrRelativeClearance).toBeNull();
  });

  it('scores a rejection by its own wick-to-range ratio', () => {
    const rejectionPoint = candle(1, { open: 95, high: 102, low: 94, close: 96 });
    const classification: ReactionClassification = { state: 'REJECTED_LEVEL', breakoutPoint: null, retestPoint: null, rejectionPoint };
    const result = scoreQuality(classification, HIGH_LEVEL, []);
    // range = 102-94 = 8; wick = 102 - max(95,96) = 6; ratio = 6/8 = 0.75.
    expect(result.value).toBeCloseTo(75, 5);
    expect(result.atrRelativeClearance).toBeNull();
  });

  it('scores a breakout by its own body-to-range/close-position average, with ATR-relative clearance', () => {
    const breakoutPoint = candle(1, { open: 99, high: 105, low: 98, close: 104 });
    const classification: ReactionClassification = { state: 'BREAKOUT_UNCONFIRMED', breakoutPoint, retestPoint: null, rejectionPoint: null };
    const atrSeries = buildAtrSeries([breakoutPoint], 1);
    const result = scoreQuality(classification, HIGH_LEVEL, atrSeries);
    // range = 7; bodyToRange = 5/7; closePosition = (104-98)/7 = 6/7; average*100 = (5/7+6/7)/2*100.
    expect(result.value).toBeCloseTo(((5 / 7 + 6 / 7) / 2) * 100, 5);
    expect(result.atrRelativeClearance).toBeCloseTo(4, 5);
  });

  it('reports a zero score with no ATR clearance when a bar has zero range', () => {
    const rejectionPoint = candle(1, { open: 100, high: 100, low: 100, close: 100 });
    const classification: ReactionClassification = { state: 'REJECTED_LEVEL', breakoutPoint: null, retestPoint: null, rejectionPoint };
    const result = scoreQuality(classification, HIGH_LEVEL, []);
    expect(result.value).toBe(0);
  });

  it('reports null ATR-relative clearance when no ATR entry exists at the breakout point', () => {
    const breakoutPoint = candle(1, { open: 99, high: 105, low: 98, close: 104 });
    const classification: ReactionClassification = { state: 'BREAKOUT_UNCONFIRMED', breakoutPoint, retestPoint: null, rejectionPoint: null };
    const result = scoreQuality(classification, HIGH_LEVEL, []);
    expect(result.atrRelativeClearance).toBeNull();
  });
});
