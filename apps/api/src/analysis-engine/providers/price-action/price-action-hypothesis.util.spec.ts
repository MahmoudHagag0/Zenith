import { Prisma } from '@zenith/database';
import { buildInvalidation, buildSurvivalReasons, buildWeaknesses, determineAlternate } from './price-action-hypothesis.util';
import { buildAtrSeries, candle } from './price-action-test-fixtures';
import type { KeyLevel, PriceActionReading, ReactionClassification } from './price-action.types';

const HIGH_LEVEL: KeyLevel = { type: 'HIGH', price: new Prisma.Decimal(100), timestamp: new Date(Date.UTC(2026, 0, 1)) };

describe('determineAlternate', () => {
  it('returns null for APPROACHING_LEVEL, which has no decisive point', () => {
    const classification: ReactionClassification = { state: 'APPROACHING_LEVEL', breakoutPoint: null, retestPoint: null, rejectionPoint: null };
    expect(determineAlternate(classification, HIGH_LEVEL, [])).toBeNull();
  });

  it('discloses a boundary-proximity alternate when the decisive close is within the margin of the level', () => {
    const rejectionPoint = candle(1, { open: 95, high: 102, low: 94, close: 100.05 });
    const classification: ReactionClassification = { state: 'REJECTED_LEVEL', breakoutPoint: null, retestPoint: null, rejectionPoint };
    const atrSeries = buildAtrSeries([rejectionPoint], 1);
    const alternate = determineAlternate(classification, HIGH_LEVEL, atrSeries);
    expect(alternate).not.toBeNull();
    expect(alternate!.state).toBe('BREAKOUT_UNCONFIRMED');
    expect(alternate!.marginAtr).toBeCloseTo(0.05, 5);
  });

  it('returns null when the decisive close is well beyond the boundary-proximity margin', () => {
    const rejectionPoint = candle(1, { open: 95, high: 102, low: 94, close: 96 });
    const classification: ReactionClassification = { state: 'REJECTED_LEVEL', breakoutPoint: null, retestPoint: null, rejectionPoint };
    const atrSeries = buildAtrSeries([rejectionPoint], 1);
    expect(determineAlternate(classification, HIGH_LEVEL, atrSeries)).toBeNull();
  });

  it('returns null when no ATR value is available', () => {
    const rejectionPoint = candle(1, { open: 95, high: 102, low: 94, close: 100.05 });
    const classification: ReactionClassification = { state: 'REJECTED_LEVEL', breakoutPoint: null, retestPoint: null, rejectionPoint };
    expect(determineAlternate(classification, HIGH_LEVEL, [])).toBeNull();
  });
});

describe('buildInvalidation', () => {
  const states: ReactionClassification['state'][] = ['APPROACHING_LEVEL', 'REJECTED_LEVEL', 'BREAKOUT_UNCONFIRMED', 'BREAKOUT_CONFIRMED', 'BREAKOUT_FAILED'];

  it.each(states)('discloses a non-empty, level-referencing invalidation description for %s', (state) => {
    const classification: ReactionClassification = { state, breakoutPoint: null, retestPoint: null, rejectionPoint: null };
    const invalidation = buildInvalidation(classification, HIGH_LEVEL);
    expect(invalidation.level).toEqual(HIGH_LEVEL.price);
    expect(invalidation.description.length).toBeGreaterThan(0);
    expect(invalidation.description).toContain('100.00');
  });
});

function reading(overrides: Partial<PriceActionReading> = {}): PriceActionReading {
  return {
    state: 'BREAKOUT_UNCONFIRMED',
    direction: 'BULLISH',
    keyLevel: HIGH_LEVEL,
    classification: { state: 'BREAKOUT_UNCONFIRMED', breakoutPoint: null, retestPoint: null, rejectionPoint: null },
    qualityScore: { value: 80, atrRelativeClearance: 2, explanation: 'strong breakout' },
    momentumScore: 70,
    continuationPace: 'CONTINUATION',
    invalidation: { level: HIGH_LEVEL.price, description: 'test invalidation' },
    survivalReasons: [],
    weaknesses: [],
    ...overrides,
  };
}

describe('buildSurvivalReasons / buildWeaknesses', () => {
  it('includes momentum and continuation pace reasons when present', () => {
    const reasons = buildSurvivalReasons(reading());
    expect(reasons.some((r) => r.includes('Momentum score 70'))).toBe(true);
    expect(reasons.some((r) => r.includes('CONTINUATION'))).toBe(true);
  });

  it('flags a low quality score as a weakness', () => {
    const weaknesses = buildWeaknesses(reading({ qualityScore: { value: 20, atrRelativeClearance: null, explanation: 'weak' } }));
    expect(weaknesses.some((w) => w.includes('20'))).toBe(true);
  });

  it('flags EXHAUSTION as a weakness', () => {
    const weaknesses = buildWeaknesses(reading({ continuationPace: 'EXHAUSTION' }));
    expect(weaknesses.some((w) => w.includes('EXHAUSTION'))).toBe(true);
  });

  it('reports no weaknesses for a strong, continuing reading', () => {
    expect(buildWeaknesses(reading())).toEqual([]);
  });
});
