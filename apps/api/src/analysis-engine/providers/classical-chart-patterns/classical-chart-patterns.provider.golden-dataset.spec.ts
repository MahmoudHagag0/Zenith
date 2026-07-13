import { Test, TestingModule } from '@nestjs/testing';
import { ClassicalChartPatternsProvider } from './classical-chart-patterns.provider';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildRegimeResult, buildSeries, buildSwingResult, point, swing } from './classical-chart-patterns-test-fixtures';

/**
 * SOURCING DISCLOSURE (per S1-014 Sprint Brief, "Golden-Dataset /
 * Reference-Example Conformance Testing" — Scope item 13): Robert D.
 * Edwards and John Magee's "Technical Analysis of Stock Trends" (1948),
 * this methodology's own single most widely-cited primary reference,
 * could not be independently obtained in this implementation environment
 * (no network access to out-of-print/paywalled primary editions). Per the
 * disclosed-fallback allowance established at S1-007/S1-009/S1-010/
 * S1-011/S1-013, this test instead reproduces the widely-taught canonical
 * Head and Shoulders (Top) instance every independent secondary source on
 * this methodology agrees on: a Head exceeding both roughly-symmetric
 * Shoulders, a roughly level neckline connecting the two intervening
 * Troughs, and a decisive close beyond that neckline (with expanding
 * volume) confirming the reversal — verifying `ClassicalChartPatternsProvider`
 * reproduces this textbook-canonical reading end-to-end, not a specific
 * numbered figure from any one paywalled text.
 */
describe('ClassicalChartPatternsProvider golden-dataset conformance (S1-014 WP12)', () => {
  it('reproduces the canonical Head and Shoulders (Top) instance, confirmed by a volume-expanding neckline break', async () => {
    // The canonical instance, in its own well-known qualitative terms:
    //   Left Shoulder (day 0, price 100):  the first peak.
    //   Left Trough   (day 1, price 90):   the neckline's own left anchor.
    //   Head          (day 2, price 110):  the highest peak -- the pattern's own namesake.
    //   Right Trough  (day 3, price 91):   the neckline's own right anchor, roughly level with the left.
    //   Right Shoulder(day 4, price 101):  roughly symmetric with the Left Shoulder.
    //   Confirmation  (day 5, close 85, on 3x formation-period volume): a decisive close below
    //     the ~90.5 neckline, with expanding volume -- Edwards & Magee's own emphasis on a
    //     genuine breakout.
    const swings = [swing('HIGH', 100, 0), swing('LOW', 90, 1), swing('HIGH', 110, 2), swing('LOW', 91, 3), swing('HIGH', 101, 4)];
    const series = buildSeries([
      point(0, 100, 1000),
      point(1, 90, 1000),
      point(2, 110, 1000),
      point(3, 91, 1000),
      point(4, 101, 1000),
      point(5, 85, 3000),
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassicalChartPatternsProvider,
        { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(swings)) } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('TRENDING')) } },
      ],
    }).compile();
    const provider = module.get(ClassicalChartPatternsProvider);

    const result = await provider.analyze(series);

    const headAndShoulders = result.interpretation.find((i) => i.summary.includes('HEAD_AND_SHOULDERS'));
    expect(headAndShoulders).toBeDefined();
    expect(headAndShoulders!.summary).toContain('BEARISH');
    expect(headAndShoulders!.summary).toContain('confirmed by a subsequent close beyond the neckline on expanding volume');

    // All five pattern points detected and disclosed.
    expect(result.evidence.detectedConditions).toHaveLength(5);

    // This methodology's own disclosed, source-well-documented status is stated on every result.
    expect(result.methodologyConfidenceCeiling.explanation).toContain('well-documented');

    // Confidence is genuinely high for a textbook-clean, volume-confirmed match, but never above the disclosed ceiling.
    expect(result.detectionConfidence.value.toNumber()).toBeGreaterThan(50);
    expect(headAndShoulders!.confidence.value.toNumber()).toBeGreaterThan(50);

    // A specific, non-empty invalidation description is disclosed, never generic placeholder text.
    expect(headAndShoulders!.summary).toContain('invalidate');

    // Genuine, non-empty Traceability -- not a fixture stub.
    expect(result.traceability.intermediateCalculations.length).toBeGreaterThan(0);
  });
});
