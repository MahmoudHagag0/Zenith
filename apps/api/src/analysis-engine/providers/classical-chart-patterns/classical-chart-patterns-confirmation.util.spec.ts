import { scoreConfirmation } from './classical-chart-patterns-confirmation.util';
import { applyShapeCriteria } from './classical-chart-patterns-shape-criteria.util';
import { generateChartPatternCandidates } from './classical-chart-patterns-candidate-generator.util';
import { buildSeries, buildSwingResult, headAndShouldersSwings, point } from './classical-chart-patterns-test-fixtures';

function buildHeadAndShouldersCandidate() {
  const swings = headAndShouldersSwings();
  const [candidate] = generateChartPatternCandidates(buildSwingResult(swings)).filter((c) => c.patternType === 'HEAD_AND_SHOULDERS');
  return applyShapeCriteria(candidate)!;
}

describe('scoreConfirmation (S1-014 WP4)', () => {
  it('scores UNCONFIRMED when no subsequent point closes beyond the neckline', () => {
    const candidate = buildHeadAndShouldersCandidate();
    const series = buildSeries([point(0, 100), point(1, 90), point(2, 110), point(3, 91), point(4, 101), point(5, 95)]);

    const scored = scoreConfirmation(candidate, series);

    expect(scored.confirmationStatus).toBe('UNCONFIRMED');
  });

  it('scores CONFIRMED strictly higher than UNCONFIRMED when a subsequent close breaks the neckline', () => {
    const candidate = buildHeadAndShouldersCandidate();
    const unconfirmedSeries = buildSeries([point(0, 100), point(1, 90), point(2, 110), point(3, 91), point(4, 101), point(5, 95)]);
    const confirmedSeries = buildSeries([point(0, 100), point(1, 90), point(2, 110), point(3, 91), point(4, 101), point(5, 80)]);

    const unconfirmed = scoreConfirmation(candidate, unconfirmedSeries);
    const confirmed = scoreConfirmation(candidate, confirmedSeries);

    expect(confirmed.confirmationStatus).toBe('CONFIRMED');
    expect(confirmed.interpretationScore).toBeGreaterThan(unconfirmed.interpretationScore);
  });

  it('upgrades to VOLUME_CONFIRMED when the confirming close\'s own volume exceeds the formation-period average by the disclosed margin', () => {
    const candidate = buildHeadAndShouldersCandidate();
    const lowVolumeSeries = buildSeries([
      point(0, 100, 1000),
      point(1, 90, 1000),
      point(2, 110, 1000),
      point(3, 91, 1000),
      point(4, 101, 1000),
      point(5, 80, 1000),
    ]);
    const highVolumeSeries = buildSeries([
      point(0, 100, 1000),
      point(1, 90, 1000),
      point(2, 110, 1000),
      point(3, 91, 1000),
      point(4, 101, 1000),
      point(5, 80, 5000),
    ]);

    const lowVolume = scoreConfirmation(candidate, lowVolumeSeries);
    const highVolume = scoreConfirmation(candidate, highVolumeSeries);

    expect(lowVolume.confirmationStatus).toBe('CONFIRMED');
    expect(highVolume.confirmationStatus).toBe('VOLUME_CONFIRMED');
    expect(highVolume.interpretationScore).toBeGreaterThan(lowVolume.interpretationScore);
  });

  it('discloses a specific, non-empty invalidation description referencing the pattern\'s own most extreme point', () => {
    const candidate = buildHeadAndShouldersCandidate();
    const series = buildSeries([point(0, 100), point(1, 90), point(2, 110), point(3, 91), point(4, 101)]);

    const scored = scoreConfirmation(candidate, series);

    expect(scored.invalidation.description.length).toBeGreaterThan(0);
    expect(scored.invalidation.level.toNumber()).toBe(110);
  });
});
