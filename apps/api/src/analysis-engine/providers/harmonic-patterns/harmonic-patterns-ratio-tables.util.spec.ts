import { computeLegRatios, GARTLEY_RATIOS } from './harmonic-patterns-ratio-tables.util';
import { bullishXabcdSwings, buildSwingResult, GARTLEY_BULLISH_PRICES } from './harmonic-patterns-test-fixtures';
import { generateHarmonicCandidates } from './harmonic-patterns-candidate-generator.util';

describe('computeLegRatios (S1-013 WP3)', () => {
  it('computes the four ratios directly from a candidate matching the textbook Gartley fixture', () => {
    const swings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES);
    const [candidate] = generateHarmonicCandidates(buildSwingResult(swings));

    const ratios = computeLegRatios(candidate);

    expect(ratios.ab).toBeCloseTo(0.618, 3);
    expect(ratios.bc).toBeCloseTo(0.618, 3);
    expect(ratios.ad).toBeCloseTo(0.786, 3);
    expect(ratios.cd).toBeGreaterThanOrEqual(GARTLEY_RATIOS.cd.min);
    expect(ratios.cd).toBeLessThanOrEqual(GARTLEY_RATIOS.cd.max);
  });
});
