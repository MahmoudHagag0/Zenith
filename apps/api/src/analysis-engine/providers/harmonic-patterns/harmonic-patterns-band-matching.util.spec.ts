import { matchPatternTypes } from './harmonic-patterns-band-matching.util';
import { generateHarmonicCandidates } from './harmonic-patterns-candidate-generator.util';
import { bullishXabcdSwings, buildSwingResult, GARTLEY_BULLISH_PRICES } from './harmonic-patterns-test-fixtures';
import type { PatternRatioTable } from './harmonic-patterns.types';

describe('matchPatternTypes (S1-013 WP3)', () => {
  it('identifies a Gartley-band-satisfying candidate as GARTLEY, and not Bat/Butterfly/Crab', () => {
    const swings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES);
    const [candidate] = generateHarmonicCandidates(buildSwingResult(swings));

    const matches = matchPatternTypes(candidate);

    expect(matches.map((m) => m.patternType)).toEqual(['GARTLEY']);
  });

  it('discards a candidate entirely when its ratios fall outside every named pattern\'s bands', () => {
    // AB retraces only 10% of XA -- far below every pattern's own AB band lower bound.
    const swings = bullishXabcdSwings({ x: 0, a: 100, b: 90, c: 95, d: 50 });
    const [candidate] = generateHarmonicCandidates(buildSwingResult(swings));

    const matches = matchPatternTypes(candidate);

    expect(matches).toEqual([]);
  });

  it('produces independent hypotheses for a candidate whose ratios satisfy more than one pattern\'s bands, never merged', () => {
    // With the real, honestly-sourced ratio tables, every pattern's own `ad` band is
    // mutually disjoint from the others (each pattern's own primary differentiator) --
    // genuine simultaneous multi-pattern matches are therefore rare by design, not a gap
    // in the matching mechanism itself. This test proves the mechanism (check every table
    // independently, never merge) directly, via matchPatternTypes' own disclosed `tables`
    // parameter and two deliberately overlapping synthetic tables -- the same category of
    // deliberately-constructed-not-organically-realistic fixture used throughout this
    // series' own edge-case tests.
    const gartleySwings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES);
    const [candidate] = generateHarmonicCandidates(buildSwingResult(gartleySwings));
    const wideTableA: PatternRatioTable = { patternType: 'GARTLEY', ab: { min: 0, max: 1, ideal: 0.618 }, bc: { min: 0, max: 1, ideal: 0.618 }, cd: { min: 0, max: 5, ideal: 1.272 }, ad: { min: 0, max: 1, ideal: 0.786 } };
    const wideTableB: PatternRatioTable = { patternType: 'BAT', ab: { min: 0, max: 1, ideal: 0.446 }, bc: { min: 0, max: 1, ideal: 0.618 }, cd: { min: 0, max: 5, ideal: 2.0 }, ad: { min: 0, max: 1, ideal: 0.886 } };

    const matches = matchPatternTypes(candidate, [wideTableA, wideTableB]);

    expect(matches.map((m) => m.patternType).sort()).toEqual(['BAT', 'GARTLEY']);
  });

  it('scores a ratio at a band\'s exact center with a higher Detection Confidence margin than one near the band\'s edge', () => {
    // Gartley's ab band is [0.58, 0.66] -- center 0.62.
    const centeredSwings = bullishXabcdSwings({ x: 0, a: 100, b: 38, c: 76.4, d: 21.4 });
    const edgeSwings = bullishXabcdSwings({ x: 0, a: 100, b: 41.5, c: 76.4, d: 21.4 });
    const [centeredCandidate] = generateHarmonicCandidates(buildSwingResult(centeredSwings));
    const [edgeCandidate] = generateHarmonicCandidates(buildSwingResult(edgeSwings));

    const [centeredMatch] = matchPatternTypes(centeredCandidate);
    const [edgeMatch] = matchPatternTypes(edgeCandidate);

    expect(centeredMatch).toBeDefined();
    expect(edgeMatch).toBeDefined();
    expect(centeredMatch.detectionScore).toBeGreaterThan(edgeMatch.detectionScore);
  });

  it('discloses a specific, non-empty invalidation description on every match', () => {
    const swings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES);
    const [candidate] = generateHarmonicCandidates(buildSwingResult(swings));
    const [match] = matchPatternTypes(candidate);

    expect(match.invalidation.description.length).toBeGreaterThan(0);
    expect(match.invalidation.level).toBeDefined();
  });
});
