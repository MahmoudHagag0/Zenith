import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence, METHODOLOGY_CONFIDENCE_CEILING } from './classical-chart-patterns-confidence.util';
import { scoreConfirmation } from './classical-chart-patterns-confirmation.util';
import { applyShapeCriteria } from './classical-chart-patterns-shape-criteria.util';
import { generateChartPatternCandidates } from './classical-chart-patterns-candidate-generator.util';
import { buildRegimeResult, buildSeries, buildSwingResult, headAndShouldersSwings, point } from './classical-chart-patterns-test-fixtures';

function buildPrimary() {
  const raw = generateChartPatternCandidates(buildSwingResult(headAndShouldersSwings())).find((c) => c.patternType === 'HEAD_AND_SHOULDERS')!;
  const series = buildSeries([point(0, 100), point(1, 90), point(2, 110), point(3, 91), point(4, 101)]);
  return scoreConfirmation(applyShapeCriteria(raw)!, series);
}

describe('Classical Chart Patterns confidence taxonomy (S1-014 WP7)', () => {
  it('reports Regime-Adjusted Confidence higher for an identical match when the regime reads TRENDING than RANGING', () => {
    const primary = buildPrimary();
    const dampened = { ...primary, interpretationScore: 40 };

    const trending = buildRegimeAdjustedConfidence(dampened, buildRegimeResult('TRENDING'));
    const ranging = buildRegimeAdjustedConfidence(dampened, buildRegimeResult('RANGING'));

    expect(trending.value.toNumber()).toBeGreaterThan(ranging.value.toNumber());
  });

  it('reports a Methodology Confidence Ceiling distinct from 60, 65, 75, and 85', () => {
    const ceiling = buildMethodologyConfidenceCeiling();
    expect(ceiling.value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
    expect([60, 65, 75, 85]).not.toContain(ceiling.value.toNumber());
  });

  it('never reports a confidence value above the Methodology Confidence Ceiling', () => {
    const primary = { ...buildPrimary(), detectionScore: 100, interpretationScore: 100 };
    const detection = buildDetectionConfidence(primary);
    const interpretation = buildInterpretationConfidence(primary);
    const regimeAdjusted = buildRegimeAdjustedConfidence(primary, buildRegimeResult('TRENDING'));

    expect(detection.value.toNumber()).toBeLessThanOrEqual(METHODOLOGY_CONFIDENCE_CEILING);
    expect(interpretation.value.toNumber()).toBeLessThanOrEqual(METHODOLOGY_CONFIDENCE_CEILING);
    expect(regimeAdjusted.value.toNumber()).toBeLessThanOrEqual(METHODOLOGY_CONFIDENCE_CEILING);
  });

  it('labels all four Confidence kinds correctly', () => {
    const primary = buildPrimary();
    expect(buildDetectionConfidence(primary).kind).toBe('DETECTION');
    expect(buildInterpretationConfidence(primary).kind).toBe('INTERPRETATION');
    expect(buildRegimeAdjustedConfidence(primary, buildRegimeResult('TRENDING')).kind).toBe('REGIME_ADJUSTED');
    expect(buildMethodologyConfidenceCeiling().kind).toBe('METHODOLOGY_CEILING');
  });
});
