import { generateHarmonicCandidates } from './harmonic-patterns-candidate-generator.util';
import { bullishXabcdSwings, buildSwingResult, swing, GARTLEY_BULLISH_PRICES } from './harmonic-patterns-test-fixtures';

describe('generateHarmonicCandidates (S1-013 WP2)', () => {
  it('produces exactly one raw candidate with four correct legs from exactly 5 correctly-alternating swings', () => {
    const swings = bullishXabcdSwings(GARTLEY_BULLISH_PRICES);
    const candidates = generateHarmonicCandidates(buildSwingResult(swings));

    expect(candidates).toHaveLength(1);
    expect(candidates[0].direction).toBe('BULLISH');
    expect(candidates[0].legs).toHaveLength(4);
    expect(candidates[0].legs.map((leg) => leg.label)).toEqual(['XA', 'AB', 'BC', 'CD']);
  });

  it('produces zero candidates when the swing type sequence does not alternate correctly', () => {
    const swings = [swing('LOW', 0, 0), swing('LOW', 50, 1), swing('HIGH', 100, 2), swing('LOW', 20, 3), swing('HIGH', 80, 4)];
    const candidates = generateHarmonicCandidates(buildSwingResult(swings));
    expect(candidates).toHaveLength(0);
  });

  it('produces multiple overlapping-window candidates from more than 5 swings, confirming a sliding-window scan', () => {
    const swings = [
      swing('LOW', 0, 0),
      swing('HIGH', 100, 1),
      swing('LOW', 40, 2),
      swing('HIGH', 80, 3),
      swing('LOW', 20, 4),
      swing('HIGH', 90, 5),
      swing('LOW', 30, 6),
    ];
    const candidates = generateHarmonicCandidates(buildSwingResult(swings));
    expect(candidates.length).toBeGreaterThan(1);
  });

  it('produces a bearish candidate from a HIGH,LOW,HIGH,LOW,HIGH sequence', () => {
    const swings = [swing('HIGH', 100, 0), swing('LOW', 0, 1), swing('HIGH', 61.8, 2), swing('LOW', 23.6, 3), swing('HIGH', 78.6, 4)];
    const candidates = generateHarmonicCandidates(buildSwingResult(swings));
    expect(candidates).toHaveLength(1);
    expect(candidates[0].direction).toBe('BEARISH');
  });
});
