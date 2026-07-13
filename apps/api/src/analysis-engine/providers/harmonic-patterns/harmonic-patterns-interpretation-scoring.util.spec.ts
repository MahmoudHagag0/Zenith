import { scoreInterpretation } from './harmonic-patterns-interpretation-scoring.util';
import { matchPatternTypes } from './harmonic-patterns-band-matching.util';
import { generateHarmonicCandidates } from './harmonic-patterns-candidate-generator.util';
import { bullishXabcdSwings, buildSwingResult, GARTLEY_BULLISH_PRICES } from './harmonic-patterns-test-fixtures';

describe('scoreInterpretation (S1-013 WP4)', () => {
  it('scores a near-ideal-ratio, time-symmetric candidate higher than a band-edge, time-asymmetric one', () => {
    // Near-ideal, time-symmetric: AB and CD legs both span 1 day (symmetric duration), ratios at Gartley's own ideal values.
    const idealSwings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES, [0, 1, 2, 3, 4]);
    const [idealCandidate] = generateHarmonicCandidates(buildSwingResult(idealSwings));
    const [idealMatch] = matchPatternTypes(idealCandidate);

    // Band-edge ratios (ab near Gartley's 0.66 edge) and asymmetric AB (1 day) vs. CD (20 days) duration.
    const edgeSwings = bullishXabcdSwings({ x: 0, a: 100, b: 34, c: 76.4, d: 21.4 }, [0, 1, 2, 3, 23]);
    const [edgeCandidate] = generateHarmonicCandidates(buildSwingResult(edgeSwings));
    const edgeMatches = matchPatternTypes(edgeCandidate);
    const edgeMatch = edgeMatches.find((m) => m.patternType === 'GARTLEY');

    const scoredIdeal = scoreInterpretation(idealMatch);
    expect(edgeMatch).toBeDefined();
    const scoredEdge = scoreInterpretation(edgeMatch!);

    expect(scoredIdeal.interpretationScore).toBeGreaterThan(scoredEdge.interpretationScore);
  });

  it('isolates the AB=CD time-symmetry signal as genuinely load-bearing, not a no-op', () => {
    const symmetricSwings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES, [0, 1, 2, 3, 4]);
    const [symmetricCandidate] = generateHarmonicCandidates(buildSwingResult(symmetricSwings));
    const [symmetricMatch] = matchPatternTypes(symmetricCandidate);

    const asymmetricSwings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES, [0, 1, 2, 3, 30]);
    const [asymmetricCandidate] = generateHarmonicCandidates(buildSwingResult(asymmetricSwings));
    const [asymmetricMatch] = matchPatternTypes(asymmetricCandidate);

    const scoredSymmetric = scoreInterpretation(symmetricMatch);
    const scoredAsymmetric = scoreInterpretation(asymmetricMatch);

    expect(scoredSymmetric.timeSymmetryScore).toBeGreaterThan(scoredAsymmetric.timeSymmetryScore);
    expect(scoredSymmetric.interpretationScore).toBeGreaterThan(scoredAsymmetric.interpretationScore);
  });
});
