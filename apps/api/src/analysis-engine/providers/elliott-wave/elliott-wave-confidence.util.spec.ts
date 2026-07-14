import { Prisma } from '@zenith/database';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence, METHODOLOGY_CONFIDENCE_CEILING } from './elliott-wave-confidence.util';
import { buildRegimeResult } from './elliott-wave-test-fixtures';
import type { WaveCountCandidate } from './elliott-wave.types';

function candidate(guidelineScore: number, ruleMargins = { rule1: 80, rule2: 80, rule3: 80 }): WaveCountCandidate {
  return {
    direction: 'BULLISH',
    legs: [],
    invalidation: { rule: 'RULE_3', level: new Prisma.Decimal(100), description: 'test fixture' },
    ruleMargins,
    guidelineChecks: [],
    guidelineScore,
    survivalReasons: [],
    weaknesses: [],
  };
}

describe('Elliott Wave confidence taxonomy (WP7)', () => {
  it('Methodology Confidence Ceiling is a disclosed constant distinct from both other registered Providers own ceilings (85 and 60)', () => {
    const ceiling = buildMethodologyConfidenceCeiling();
    expect(ceiling.kind).toBe('METHODOLOGY_CEILING');
    expect(ceiling.value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
    expect(ceiling.value.toNumber()).not.toBe(85);
    expect(ceiling.value.toNumber()).not.toBe(60);
  });

  it('Detection Confidence equals the weakest of the three Rule margins, capped at the ceiling', () => {
    expect(buildDetectionConfidence(candidate(70, { rule1: 90, rule2: 20, rule3: 95 })).value).toEqual(new Prisma.Decimal(20));
    expect(buildDetectionConfidence(candidate(70, { rule1: 90, rule2: 90, rule3: 90 })).value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
  });

  it('Interpretation Confidence wraps the guideline score, capped at the ceiling', () => {
    expect(buildInterpretationConfidence(candidate(40)).value).toEqual(new Prisma.Decimal(40));
    expect(buildInterpretationConfidence(candidate(100)).value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
  });

  it('strengthens Regime-Adjusted Confidence in TRENDING and weakens it in RANGING for an identical candidate', () => {
    const trending = buildRegimeAdjustedConfidence(candidate(40), buildRegimeResult('TRENDING'));
    const ranging = buildRegimeAdjustedConfidence(candidate(40), buildRegimeResult('RANGING'));

    expect(trending.value.greaterThan(ranging.value)).toBe(true);
    expect(trending.value).toEqual(new Prisma.Decimal(48));
    expect(ranging.value).toEqual(new Prisma.Decimal(28));
  });
});
