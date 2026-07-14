import { generateWaveCountCandidates } from './elliott-wave-candidate-generator.util';
import { buildSwingResult, swing } from './elliott-wave-test-fixtures';

describe('generateWaveCountCandidates (WP2)', () => {
  it('produces exactly one Bullish candidate with 5 correctly-ordered legs from 6 alternating swings', () => {
    const swings = [swing('LOW', 100, 0), swing('HIGH', 110, 1), swing('LOW', 105, 2), swing('HIGH', 120, 3), swing('LOW', 112, 4), swing('HIGH', 130, 5)];
    const swingResult = buildSwingResult(swings);

    const candidates = generateWaveCountCandidates(swingResult);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].direction).toBe('BULLISH');
    expect(candidates[0].legs).toHaveLength(5);
    expect(candidates[0].legs.map((leg) => leg.waveNumber)).toEqual([1, 2, 3, 4, 5]);
    expect(candidates[0].legs[0].startPrice).toEqual(swings[0].price);
    expect(candidates[0].legs[4].endPrice).toEqual(swings[5].price);
  });

  it('produces exactly one Bearish candidate from 6 alternating swings starting at a HIGH', () => {
    const swings = [swing('HIGH', 130, 0), swing('LOW', 120, 1), swing('HIGH', 125, 2), swing('LOW', 110, 3), swing('HIGH', 118, 4), swing('LOW', 100, 5)];
    const swingResult = buildSwingResult(swings);

    const candidates = generateWaveCountCandidates(swingResult);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].direction).toBe('BEARISH');
  });

  it('produces zero candidates when the swing type sequence does not alternate correctly', () => {
    const swings = [swing('LOW', 100, 0), swing('LOW', 105, 1), swing('HIGH', 110, 2), swing('LOW', 108, 3), swing('HIGH', 115, 4), swing('LOW', 112, 5)];
    const swingResult = buildSwingResult(swings);

    expect(generateWaveCountCandidates(swingResult)).toEqual([]);
  });

  it('produces zero candidates when fewer than 6 swings are available', () => {
    const swings = [swing('LOW', 100, 0), swing('HIGH', 110, 1), swing('LOW', 105, 2)];
    expect(generateWaveCountCandidates(buildSwingResult(swings))).toEqual([]);
  });

  it('scans consecutive overlapping windows, not just a single fixed offset', () => {
    const swings = [
      swing('LOW', 100, 0),
      swing('HIGH', 110, 1),
      swing('LOW', 105, 2),
      swing('HIGH', 120, 3),
      swing('LOW', 112, 4),
      swing('HIGH', 130, 5),
      swing('LOW', 122, 6),
      swing('HIGH', 140, 7),
    ];
    const swingResult = buildSwingResult(swings);

    const candidates = generateWaveCountCandidates(swingResult);

    // 8 perfectly-alternating swings yield 3 overlapping 6-swing windows (offsets 0, 1, 2),
    // alternating Bullish/Bearish/Bullish -- proof this is a sliding scan, not a single fixed offset.
    expect(candidates).toHaveLength(3);
    expect(candidates.map((candidate) => candidate.direction)).toEqual(['BULLISH', 'BEARISH', 'BULLISH']);
  });
});
