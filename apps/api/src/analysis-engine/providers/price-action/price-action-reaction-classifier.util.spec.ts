import { Prisma } from '@zenith/database';
import { classifyReaction, directionFor } from './price-action-reaction-classifier.util';
import { candle } from './price-action-test-fixtures';
import type { KeyLevel } from './price-action.types';

const HIGH_LEVEL: KeyLevel = { type: 'HIGH', price: new Prisma.Decimal(100), timestamp: new Date(Date.UTC(2026, 0, 1)) };
const LOW_LEVEL: KeyLevel = { type: 'LOW', price: new Prisma.Decimal(100), timestamp: new Date(Date.UTC(2026, 0, 1)) };

describe('classifyReaction — HIGH key level (resistance)', () => {
  it('classifies APPROACHING_LEVEL when no subsequent point ever reaches the level', () => {
    const points = [candle(1, { open: 90, high: 92, low: 88, close: 91 }), candle(2, { open: 91, high: 93, low: 89, close: 92 })];
    const result = classifyReaction(HIGH_LEVEL, points);
    expect(result).toEqual({ state: 'APPROACHING_LEVEL', breakoutPoint: null, retestPoint: null, rejectionPoint: null });
  });

  it('classifies REJECTED_LEVEL when the first interacting point wicks above the level but closes back below it', () => {
    const points = [candle(1, { open: 95, high: 102, low: 94, close: 96 })];
    const result = classifyReaction(HIGH_LEVEL, points);
    expect(result.state).toBe('REJECTED_LEVEL');
    expect(result.rejectionPoint).toBe(points[0]);
    expect(result.breakoutPoint).toBeNull();
  });

  it('classifies BREAKOUT_UNCONFIRMED when the level is decisively closed beyond with no subsequent retest or failure', () => {
    const points = [candle(1, { open: 99, high: 105, low: 98, close: 104 })];
    const result = classifyReaction(HIGH_LEVEL, points);
    expect(result.state).toBe('BREAKOUT_UNCONFIRMED');
    expect(result.breakoutPoint).toBe(points[0]);
  });

  it('classifies BREAKOUT_CONFIRMED when a subsequent point retests the level and holds', () => {
    const points = [candle(1, { open: 99, high: 105, low: 98, close: 104 }), candle(2, { open: 104, high: 106, low: 99, close: 105 })];
    const result = classifyReaction(HIGH_LEVEL, points);
    expect(result.state).toBe('BREAKOUT_CONFIRMED');
    expect(result.breakoutPoint).toBe(points[0]);
    expect(result.retestPoint).toBe(points[1]);
  });

  it('classifies BREAKOUT_FAILED when a subsequent point closes back across the level', () => {
    const points = [candle(1, { open: 99, high: 105, low: 98, close: 104 }), candle(2, { open: 104, high: 104, low: 96, close: 97 })];
    const result = classifyReaction(HIGH_LEVEL, points);
    expect(result.state).toBe('BREAKOUT_FAILED');
    expect(result.breakoutPoint).toBe(points[0]);
    expect(result.rejectionPoint).toBe(points[1]);
  });

  it('scans sequentially so the first failure or retest wins, not a later one', () => {
    const points = [
      candle(1, { open: 99, high: 105, low: 98, close: 104 }),
      candle(2, { open: 104, high: 104, low: 96, close: 97 }),
      candle(3, { open: 97, high: 106, low: 96, close: 105 }),
    ];
    const result = classifyReaction(HIGH_LEVEL, points);
    expect(result.state).toBe('BREAKOUT_FAILED');
    expect(result.rejectionPoint).toBe(points[1]);
  });
});

describe('classifyReaction — LOW key level (support)', () => {
  it('classifies REJECTED_LEVEL when the first interacting point wicks below the level but closes back above it', () => {
    const points = [candle(1, { open: 105, high: 106, low: 98, close: 104 })];
    const result = classifyReaction(LOW_LEVEL, points);
    expect(result.state).toBe('REJECTED_LEVEL');
    expect(result.rejectionPoint).toBe(points[0]);
  });

  it('classifies BREAKOUT_UNCONFIRMED when the level is decisively closed below', () => {
    const points = [candle(1, { open: 101, high: 102, low: 95, close: 96 })];
    const result = classifyReaction(LOW_LEVEL, points);
    expect(result.state).toBe('BREAKOUT_UNCONFIRMED');
  });
});

describe('directionFor', () => {
  it('reports BULLISH for a breakout above a HIGH level, and the opposite (BEARISH) for its own failure', () => {
    expect(directionFor('BREAKOUT_UNCONFIRMED', HIGH_LEVEL)).toBe('BULLISH');
    expect(directionFor('BREAKOUT_CONFIRMED', HIGH_LEVEL)).toBe('BULLISH');
    expect(directionFor('BREAKOUT_FAILED', HIGH_LEVEL)).toBe('BEARISH');
    expect(directionFor('REJECTED_LEVEL', HIGH_LEVEL)).toBe('BEARISH');
    expect(directionFor('APPROACHING_LEVEL', HIGH_LEVEL)).toBe('NEUTRAL');
  });

  it('reports BEARISH for a breakout below a LOW level, and the opposite (BULLISH) for its own failure', () => {
    expect(directionFor('BREAKOUT_UNCONFIRMED', LOW_LEVEL)).toBe('BEARISH');
    expect(directionFor('BREAKOUT_FAILED', LOW_LEVEL)).toBe('BULLISH');
    expect(directionFor('REJECTED_LEVEL', LOW_LEVEL)).toBe('BULLISH');
  });
});
