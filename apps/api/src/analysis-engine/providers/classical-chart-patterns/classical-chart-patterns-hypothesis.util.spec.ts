import { finalizeChartPatternHypotheses } from './classical-chart-patterns-hypothesis.util';
import { scoreConfirmation } from './classical-chart-patterns-confirmation.util';
import { applyShapeCriteria } from './classical-chart-patterns-shape-criteria.util';
import { generateChartPatternCandidates } from './classical-chart-patterns-candidate-generator.util';
import { buildSeries, buildSwingResult, doubleTopSwings, headAndShouldersSwings, point } from './classical-chart-patterns-test-fixtures';

describe('finalizeChartPatternHypotheses (S1-014 WP5)', () => {
  it('returns exactly one hypothesis for an unambiguous series', () => {
    const [raw] = generateChartPatternCandidates(buildSwingResult(headAndShouldersSwings())).filter((c) => c.patternType === 'HEAD_AND_SHOULDERS');
    const shapeValid = applyShapeCriteria(raw)!;
    const series = buildSeries([point(0, 100), point(1, 90), point(2, 110), point(3, 91), point(4, 101)]);
    const scored = scoreConfirmation(shapeValid, series);

    const hypotheses = finalizeChartPatternHypotheses([scored]);

    expect(hypotheses).toHaveLength(1);
    expect(hypotheses[0].patternType).toBe('HEAD_AND_SHOULDERS');
  });

  it('bounds multiple candidates at MAX_CHART_PATTERN_HYPOTHESES', () => {
    const hsRaw = generateChartPatternCandidates(buildSwingResult(headAndShouldersSwings())).find((c) => c.patternType === 'HEAD_AND_SHOULDERS')!;
    const dtRaw = generateChartPatternCandidates(buildSwingResult(doubleTopSwings())).find((c) => c.patternType === 'DOUBLE_TOP')!;
    const series = buildSeries([point(0, 100), point(1, 90), point(2, 110), point(3, 91), point(4, 101)]);
    const hsScored = scoreConfirmation(applyShapeCriteria(hsRaw)!, series);
    const dtScored = scoreConfirmation(applyShapeCriteria(dtRaw)!, series);

    const hypotheses = finalizeChartPatternHypotheses([hsScored, dtScored, hsScored, dtScored, hsScored]);

    expect(hypotheses.length).toBeLessThanOrEqual(2);
  });

  it('discloses a survival reason, confirmation status, and invalidation description on every hypothesis', () => {
    const raw = generateChartPatternCandidates(buildSwingResult(headAndShouldersSwings())).find((c) => c.patternType === 'HEAD_AND_SHOULDERS')!;
    const series = buildSeries([point(0, 100), point(1, 90), point(2, 110), point(3, 91), point(4, 101)]);
    const scored = scoreConfirmation(applyShapeCriteria(raw)!, series);

    const [hypothesis] = finalizeChartPatternHypotheses([scored]);

    expect(hypothesis.survivalReasons.length).toBeGreaterThan(0);
    expect(hypothesis.invalidation.description.length).toBeGreaterThan(0);
    expect(hypothesis.confirmationStatus).toBe('UNCONFIRMED');
  });
});
