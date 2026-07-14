import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence, METHODOLOGY_CONFIDENCE_CEILING } from './harmonic-patterns-confidence.util';
import { scoreInterpretation } from './harmonic-patterns-interpretation-scoring.util';
import { matchPatternTypes } from './harmonic-patterns-band-matching.util';
import { generateHarmonicCandidates } from './harmonic-patterns-candidate-generator.util';
import { bullishXabcdSwings, buildRegimeResult, buildSwingResult, GARTLEY_BULLISH_PRICES } from './harmonic-patterns-test-fixtures';

function buildPrimary() {
  const swings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES);
  const [candidate] = generateHarmonicCandidates(buildSwingResult(swings));
  const [match] = matchPatternTypes(candidate);
  return scoreInterpretation(match);
}

describe('Harmonic Patterns confidence taxonomy (S1-013 WP7)', () => {
  it('reports Regime-Adjusted Confidence higher for an identical match when the regime reads LOW volatility than HIGH', () => {
    const primary = buildPrimary();
    // Use a non-saturating base score so the multiplier's effect is visible, not clamped at the ceiling.
    const dampened = { ...primary, interpretationScore: 40 };

    const low = buildRegimeAdjustedConfidence(dampened, buildRegimeResult('LOW'));
    const high = buildRegimeAdjustedConfidence(dampened, buildRegimeResult('HIGH'));

    expect(low.value.toNumber()).toBeGreaterThan(high.value.toNumber());
  });

  it('reports a Methodology Confidence Ceiling distinct from 60, 75, and 85', () => {
    const ceiling = buildMethodologyConfidenceCeiling();
    expect(ceiling.value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
    expect([60, 75, 85]).not.toContain(ceiling.value.toNumber());
  });

  it('never reports a confidence value above the Methodology Confidence Ceiling', () => {
    const primary = { ...buildPrimary(), detectionScore: 100, interpretationScore: 100 };
    const detection = buildDetectionConfidence(primary);
    const interpretation = buildInterpretationConfidence(primary);
    const regimeAdjusted = buildRegimeAdjustedConfidence(primary, buildRegimeResult('LOW'));

    expect(detection.value.toNumber()).toBeLessThanOrEqual(METHODOLOGY_CONFIDENCE_CEILING);
    expect(interpretation.value.toNumber()).toBeLessThanOrEqual(METHODOLOGY_CONFIDENCE_CEILING);
    expect(regimeAdjusted.value.toNumber()).toBeLessThanOrEqual(METHODOLOGY_CONFIDENCE_CEILING);
  });

  it('labels all four Confidence kinds correctly', () => {
    const primary = buildPrimary();
    expect(buildDetectionConfidence(primary).kind).toBe('DETECTION');
    expect(buildInterpretationConfidence(primary).kind).toBe('INTERPRETATION');
    expect(buildRegimeAdjustedConfidence(primary, buildRegimeResult('LOW')).kind).toBe('REGIME_ADJUSTED');
    expect(buildMethodologyConfidenceCeiling().kind).toBe('METHODOLOGY_CEILING');
  });
});
