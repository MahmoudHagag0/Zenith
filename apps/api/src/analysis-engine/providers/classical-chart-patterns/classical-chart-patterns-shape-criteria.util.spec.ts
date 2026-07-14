import { applyShapeCriteria } from './classical-chart-patterns-shape-criteria.util';
import { generateChartPatternCandidates } from './classical-chart-patterns-candidate-generator.util';
import { buildSwingResult, doubleTopSwings, headAndShouldersSwings, swing } from './classical-chart-patterns-test-fixtures';

function findCandidate(patternType: string, swings: ReturnType<typeof swing>[]) {
  const candidates = generateChartPatternCandidates(buildSwingResult(swings));
  return candidates.find((c) => c.patternType === patternType)!;
}

describe('applyShapeCriteria (S1-014 WP3)', () => {
  it('survives a shape-valid Head and Shoulders candidate', () => {
    const candidate = findCandidate('HEAD_AND_SHOULDERS', headAndShouldersSwings());
    const result = applyShapeCriteria(candidate);
    expect(result).not.toBeNull();
    expect(result!.necklineLevel.toNumber()).toBeCloseTo(90.5, 1);
    expect(result!.detectionScore).toBeGreaterThan(0);
  });

  it('discards a Head and Shoulders candidate where the Head does not exceed both shoulders', () => {
    const swings = [swing('HIGH', 100, 0), swing('LOW', 90, 1), swing('HIGH', 95, 2), swing('LOW', 91, 3), swing('HIGH', 101, 4)];
    const candidate = findCandidate('HEAD_AND_SHOULDERS', swings);
    expect(applyShapeCriteria(candidate)).toBeNull();
  });

  it('discards a Head and Shoulders candidate whose shoulders are too asymmetric', () => {
    const swings = [swing('HIGH', 100, 0), swing('LOW', 90, 1), swing('HIGH', 150, 2), swing('LOW', 91, 3), swing('HIGH', 40, 4)];
    const candidate = findCandidate('HEAD_AND_SHOULDERS', swings);
    expect(applyShapeCriteria(candidate)).toBeNull();
  });

  it('survives a shape-valid Double Top candidate', () => {
    const candidate = findCandidate('DOUBLE_TOP', doubleTopSwings());
    const result = applyShapeCriteria(candidate);
    expect(result).not.toBeNull();
    expect(result!.necklineLevel.toNumber()).toBe(90);
  });

  it('discards a Double Top candidate whose peaks are too asymmetric', () => {
    const swings = [swing('HIGH', 100, 0), swing('LOW', 90, 1), swing('HIGH', 200, 2)];
    const candidate = findCandidate('DOUBLE_TOP', swings);
    expect(applyShapeCriteria(candidate)).toBeNull();
  });
});
