import { generateChartPatternCandidates } from './classical-chart-patterns-candidate-generator.util';
import { buildSwingResult, doubleTopSwings, headAndShouldersSwings, swing } from './classical-chart-patterns-test-fixtures';

describe('generateChartPatternCandidates (S1-014 WP2)', () => {
  it('produces exactly one HEAD_AND_SHOULDERS candidate from a correctly-alternating 5-swing window', () => {
    const candidates = generateChartPatternCandidates(buildSwingResult(headAndShouldersSwings()));
    const hs = candidates.filter((c) => c.patternType === 'HEAD_AND_SHOULDERS');
    expect(hs).toHaveLength(1);
    expect(hs[0].direction).toBe('BEARISH');
    expect(hs[0].points.map((p) => p.label)).toEqual(['LEFT_SHOULDER', 'LEFT_TROUGH', 'HEAD', 'RIGHT_TROUGH', 'RIGHT_SHOULDER']);
  });

  it('produces exactly one DOUBLE_TOP candidate from a correctly-alternating 3-swing window', () => {
    const candidates = generateChartPatternCandidates(buildSwingResult(doubleTopSwings()));
    const dt = candidates.filter((c) => c.patternType === 'DOUBLE_TOP');
    expect(dt).toHaveLength(1);
    expect(dt[0].direction).toBe('BEARISH');
    expect(dt[0].points.map((p) => p.label)).toEqual(['PEAK_1', 'TROUGH', 'PEAK_2']);
  });

  it('produces an INVERSE_HEAD_AND_SHOULDERS candidate from a LOW,HIGH,LOW,HIGH,LOW sequence', () => {
    const swings = [swing('LOW', 0, 0), swing('HIGH', 10, 1), swing('LOW', -10, 2), swing('HIGH', 11, 3), swing('LOW', 1, 4)];
    const candidates = generateChartPatternCandidates(buildSwingResult(swings));
    const inverse = candidates.filter((c) => c.patternType === 'INVERSE_HEAD_AND_SHOULDERS');
    expect(inverse).toHaveLength(1);
    expect(inverse[0].direction).toBe('BULLISH');
  });

  it('produces a DOUBLE_BOTTOM candidate from a LOW,HIGH,LOW sequence', () => {
    const swings = [swing('LOW', 0, 0), swing('HIGH', 20, 1), swing('LOW', 1, 2)];
    const candidates = generateChartPatternCandidates(buildSwingResult(swings));
    const db = candidates.filter((c) => c.patternType === 'DOUBLE_BOTTOM');
    expect(db).toHaveLength(1);
    expect(db[0].direction).toBe('BULLISH');
  });

  it('produces zero candidates when the swing type sequence does not alternate correctly', () => {
    const swings = [swing('HIGH', 0, 0), swing('HIGH', 50, 1), swing('LOW', 10, 2)];
    const candidates = generateChartPatternCandidates(buildSwingResult(swings));
    expect(candidates).toHaveLength(0);
  });

  it('produces multiple overlapping-window candidates from a longer swing sequence, confirming a sliding-window scan', () => {
    const swings = [
      swing('HIGH', 100, 0),
      swing('LOW', 90, 1),
      swing('HIGH', 110, 2),
      swing('LOW', 91, 3),
      swing('HIGH', 101, 4),
      swing('LOW', 92, 5),
      swing('HIGH', 102, 6),
    ];
    const candidates = generateChartPatternCandidates(buildSwingResult(swings));
    expect(candidates.length).toBeGreaterThan(1);
  });
});
