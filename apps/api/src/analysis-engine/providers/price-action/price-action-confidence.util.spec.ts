import { Prisma } from '@zenith/database';
import { METHODOLOGY_CONFIDENCE_CEILING, buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './price-action-confidence.util';
import { buildRegimeResult } from './price-action-test-fixtures';
import type { KeyLevel, PriceActionReading } from './price-action.types';

const HIGH_LEVEL: KeyLevel = { type: 'HIGH', price: new Prisma.Decimal(100), timestamp: new Date(Date.UTC(2026, 0, 1)) };

function reading(overrides: Partial<PriceActionReading> = {}): PriceActionReading {
  return {
    state: 'BREAKOUT_UNCONFIRMED',
    direction: 'BULLISH',
    keyLevel: HIGH_LEVEL,
    classification: { state: 'BREAKOUT_UNCONFIRMED', breakoutPoint: null, retestPoint: null, rejectionPoint: null },
    qualityScore: { value: 80, atrRelativeClearance: 2, explanation: 'strong breakout' },
    momentumScore: 60,
    continuationPace: 'CONTINUATION',
    invalidation: { level: HIGH_LEVEL.price, description: 'test invalidation' },
    survivalReasons: [],
    weaknesses: [],
    ...overrides,
  };
}

describe('buildDetectionConfidence', () => {
  it('reports a static baseline for APPROACHING_LEVEL', () => {
    expect(buildDetectionConfidence(reading({ state: 'APPROACHING_LEVEL' })).value.toNumber()).toBe(40);
  });

  it('reports the quality score, capped at the Methodology Confidence Ceiling', () => {
    expect(buildDetectionConfidence(reading()).value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
  });
});

describe('buildInterpretationConfidence', () => {
  it('averages quality and momentum for directional states', () => {
    const value = buildInterpretationConfidence(reading({ qualityScore: { value: 50, atrRelativeClearance: 1, explanation: '' }, momentumScore: 40 })).value.toNumber();
    expect(value).toBeCloseTo(45, 5);
  });

  it('uses the quality score alone for REJECTED_LEVEL', () => {
    const value = buildInterpretationConfidence(reading({ state: 'REJECTED_LEVEL', qualityScore: { value: 55, atrRelativeClearance: null, explanation: '' } })).value.toNumber();
    expect(value).toBeCloseTo(55, 5);
  });
});

describe('buildRegimeAdjustedConfidence', () => {
  it('strengthens a breakout reading when volatilityState is HIGH', () => {
    const base = reading({ qualityScore: { value: 40, atrRelativeClearance: 1, explanation: '' }, momentumScore: 40 });
    const highVol = buildRegimeAdjustedConfidence(base, buildRegimeResult('TRENDING', 'HIGH')).value.toNumber();
    const lowVol = buildRegimeAdjustedConfidence(base, buildRegimeResult('TRENDING', 'LOW')).value.toNumber();
    expect(highVol).toBeGreaterThan(lowVol);
  });

  it('strengthens a REJECTED_LEVEL reading when volatilityState is LOW (opposite bifurcation from breakout)', () => {
    const base = reading({ state: 'REJECTED_LEVEL', qualityScore: { value: 40, atrRelativeClearance: null, explanation: '' } });
    const lowVol = buildRegimeAdjustedConfidence(base, buildRegimeResult('RANGING', 'LOW')).value.toNumber();
    const highVol = buildRegimeAdjustedConfidence(base, buildRegimeResult('RANGING', 'HIGH')).value.toNumber();
    expect(lowVol).toBeGreaterThan(highVol);
  });

  it('applies no adjustment for APPROACHING_LEVEL', () => {
    const base = reading({ state: 'APPROACHING_LEVEL' });
    const interpretationValue = buildInterpretationConfidence(base).value.toNumber();
    expect(buildRegimeAdjustedConfidence(base, buildRegimeResult('TRENDING', 'HIGH')).value.toNumber()).toBeCloseTo(interpretationValue, 5);
  });
});

describe('buildMethodologyConfidenceCeiling', () => {
  it('reports the disclosed constant with a non-empty explanation', () => {
    const ceiling = buildMethodologyConfidenceCeiling();
    expect(ceiling.value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
    expect(ceiling.explanation.length).toBeGreaterThan(0);
  });
});
