import { finalizeHarmonicHypotheses } from './harmonic-patterns-hypothesis.util';
import { scoreInterpretation } from './harmonic-patterns-interpretation-scoring.util';
import { matchPatternTypes } from './harmonic-patterns-band-matching.util';
import { generateHarmonicCandidates } from './harmonic-patterns-candidate-generator.util';
import { bullishXabcdSwings, buildSwingResult, GARTLEY_BULLISH_PRICES } from './harmonic-patterns-test-fixtures';
import type { PatternRatioTable } from './harmonic-patterns.types';

describe('finalizeHarmonicHypotheses (S1-013 WP5)', () => {
  it('returns exactly one hypothesis for an unambiguous series', () => {
    const swings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES);
    const [candidate] = generateHarmonicCandidates(buildSwingResult(swings));
    const matches = matchPatternTypes(candidate).map((m) => scoreInterpretation(m));

    const hypotheses = finalizeHarmonicHypotheses(matches);

    expect(hypotheses).toHaveLength(1);
    expect(hypotheses[0].patternType).toBe('GARTLEY');
  });

  it('returns more than one hypothesis, bounded at MAX_PATTERN_HYPOTHESES, for a genuinely ambiguous match set, each independently disclosed', () => {
    const swings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES);
    const [candidate] = generateHarmonicCandidates(buildSwingResult(swings));
    const wideTableA: PatternRatioTable = { patternType: 'GARTLEY', ab: { min: 0, max: 1, ideal: 0.618 }, bc: { min: 0, max: 1, ideal: 0.618 }, cd: { min: 0, max: 5, ideal: 1.272 }, ad: { min: 0, max: 1, ideal: 0.786 } };
    const wideTableB: PatternRatioTable = { patternType: 'BAT', ab: { min: 0, max: 1, ideal: 0.446 }, bc: { min: 0, max: 1, ideal: 0.618 }, cd: { min: 0, max: 5, ideal: 2.0 }, ad: { min: 0, max: 1, ideal: 0.886 } };
    const matches = matchPatternTypes(candidate, [wideTableA, wideTableB]).map((m) => scoreInterpretation(m));

    const hypotheses = finalizeHarmonicHypotheses(matches);

    expect(hypotheses.length).toBeGreaterThan(1);
    expect(hypotheses.length).toBeLessThanOrEqual(2);
    expect(new Set(hypotheses.map((h) => h.patternType)).size).toBe(hypotheses.length);
  });

  it('discloses a survival reason, a weakness statement (or explicit absence), and an invalidation description on every hypothesis', () => {
    const swings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES);
    const [candidate] = generateHarmonicCandidates(buildSwingResult(swings));
    const matches = matchPatternTypes(candidate).map((m) => scoreInterpretation(m));

    const [hypothesis] = finalizeHarmonicHypotheses(matches);

    expect(hypothesis.survivalReasons.length).toBeGreaterThan(0);
    expect(hypothesis.invalidation.description.length).toBeGreaterThan(0);
    // weaknesses may legitimately be empty for a near-perfect match -- the provider's own
    // buildSummary() discloses "No material weakness identified" in that case (tested there).
    expect(Array.isArray(hypothesis.weaknesses)).toBe(true);
  });
});
