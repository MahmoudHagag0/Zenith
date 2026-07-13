import { Prisma } from '@zenith/database';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence, METHODOLOGY_CONFIDENCE_CEILING } from './ict-smc-confidence.util';
import { buildRegimeResult } from './ict-smc-test-fixtures';
import type { IctSmcBiasHypothesis } from './ict-smc.types';

function hypothesis(dominantPrimitive: IctSmcBiasHypothesis['dominantPrimitive'], score = 40): IctSmcBiasHypothesis {
  return { direction: 'BULLISH', score, dominantPrimitive, summary: 'test hypothesis' };
}

describe('ICT/SMC confidence taxonomy (WP7)', () => {
  it('Methodology Confidence Ceiling is a disclosed constant strictly lower than 85', () => {
    const ceiling = buildMethodologyConfidenceCeiling();
    expect(ceiling.kind).toBe('METHODOLOGY_CEILING');
    expect(ceiling.value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
    expect(ceiling.value.lessThan(85)).toBe(true);
  });

  it('Detection Confidence scales with the proportion of expected primitives detected, capped at the ceiling', () => {
    expect(buildDetectionConfidence(3).value).toEqual(new Prisma.Decimal(50));
    expect(buildDetectionConfidence(12).value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
  });

  it('Interpretation Confidence wraps the hypothesis score, capped at the ceiling', () => {
    expect(buildInterpretationConfidence(hypothesis('ORDER_BLOCK', 40)).value).toEqual(new Prisma.Decimal(40));
    expect(buildInterpretationConfidence(hypothesis('ORDER_BLOCK', 100)).value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
  });

  it('strengthens an Order-Block-dominant (continuation) reading in TRENDING and weakens it in RANGING', () => {
    const trending = buildRegimeAdjustedConfidence(hypothesis('ORDER_BLOCK', 40), buildRegimeResult('TRENDING'));
    const ranging = buildRegimeAdjustedConfidence(hypothesis('ORDER_BLOCK', 40), buildRegimeResult('RANGING'));

    expect(trending.value.greaterThan(ranging.value)).toBe(true);
    expect(trending.value).toEqual(new Prisma.Decimal(48));
    expect(ranging.value).toEqual(new Prisma.Decimal(28));
  });

  it('strengthens a Liquidity-Sweep-dominant (reversal) reading in RANGING and weakens it in TRENDING -- the mirror image of the Order-Block rule', () => {
    const ranging = buildRegimeAdjustedConfidence(hypothesis('LIQUIDITY_SWEEP', 40), buildRegimeResult('RANGING'));
    const trending = buildRegimeAdjustedConfidence(hypothesis('LIQUIDITY_SWEEP', 40), buildRegimeResult('TRENDING'));

    expect(ranging.value.greaterThan(trending.value)).toBe(true);
    expect(ranging.value).toEqual(new Prisma.Decimal(48));
    expect(trending.value).toEqual(new Prisma.Decimal(28));
  });

  it('does not scale a NEUTRAL (tied) reading regardless of regime', () => {
    const trending = buildRegimeAdjustedConfidence(hypothesis('NEUTRAL', 40), buildRegimeResult('TRENDING'));
    const ranging = buildRegimeAdjustedConfidence(hypothesis('NEUTRAL', 40), buildRegimeResult('RANGING'));

    expect(trending.value).toEqual(new Prisma.Decimal(40));
    expect(ranging.value).toEqual(new Prisma.Decimal(40));
  });
});
