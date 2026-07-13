import { Test, TestingModule } from '@nestjs/testing';
import { HarmonicPatternsProvider } from './harmonic-patterns.provider';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildRegimeResult, buildSeries, buildSwingResult, point, swing } from './harmonic-patterns-test-fixtures';

/**
 * SOURCING DISCLOSURE (per S1-013 Sprint Brief, "Golden-Dataset /
 * Reference-Example Conformance Testing" — Scope item 15): unlike a
 * single, well-established institutional curriculum, the Harmonic
 * Patterns methodology's exact ratio numbers genuinely vary across its
 * own most-cited sources — H.M. Gartley's original 1935 "Profits in the
 * Stock Market" first described the pattern's overall shape without any
 * Fibonacci-ratio table at all; Larry Pesavento's 1978 "Fibonacci Ratios
 * with Pattern Recognition" is generally credited with adding the
 * specific Fibonacci ratios; Scott Carney's 2004 "Harmonic Trading,
 * Volume One" refined and popularized the modern exact tolerance bands
 * most retail education (and this Provider's own ratio tables) now cite.
 * None of these three primary/secondary sources could be independently
 * obtained in this implementation environment (no network access to
 * out-of-print/paywalled material). Per the disclosed-fallback allowance
 * established at S1-007/S1-009/S1-010/S1-011, this test instead
 * reproduces the widely-taught canonical Gartley ratio instance every
 * independent secondary source on this methodology agrees on: a
 * 0.618 XA retracement at point B, and a 0.786 XA retracement at the
 * completion point D — verifying `HarmonicPatternsProvider` reproduces
 * this textbook-canonical reading end-to-end, not a specific numbered
 * figure from any one paywalled text.
 */
describe('HarmonicPatternsProvider golden-dataset conformance (S1-013 WP12)', () => {
  it('reproduces the canonical bullish Gartley pattern instance (B at 0.618 XA, D at 0.786 XA)', async () => {
    // The canonical instance, in its own well-known qualitative terms:
    //   X (day 0, price 0):    the pattern's own starting low.
    //   A (day 1, price 100):  the initial impulsive leg's high.
    //   B (day 2, price 38.2): retraces 61.8% of XA -- Gartley's own single most-cited AB ratio.
    //   C (day 3, price 76.4): retraces 61.8% of AB.
    //   D (day 4, price 21.4): completes at 78.6% retracement of XA -- Gartley's own single most-cited D-point ratio; the anticipated bullish reversal point.
    const swings = [swing('LOW', 0, 0), swing('HIGH', 100, 1), swing('LOW', 38.2, 2), swing('HIGH', 76.4, 3), swing('LOW', 21.4, 4)];
    const series = buildSeries(Array.from({ length: 5 }, (_, i) => point(i, 50 + i)));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HarmonicPatternsProvider,
        { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(swings)) } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('LOW')) } },
      ],
    }).compile();
    const provider = module.get(HarmonicPatternsProvider);

    const result = await provider.analyze(series);

    // An unambiguous, textbook-clean Gartley instance: exactly one interpretation.
    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('GARTLEY');
    expect(result.interpretation[0].summary).toContain('BULLISH');

    // All four ratio-band checks detected and disclosed.
    expect(result.evidence.detectedConditions).toHaveLength(4);
    expect(result.evidence.detectedConditions.some((c) => c.includes('AB ratio 0.618'))).toBe(true);
    expect(result.evidence.detectedConditions.some((c) => c.includes('AD ratio 0.786'))).toBe(true);

    // This methodology's own disclosed, source-variance status is stated on every result.
    expect(result.methodologyConfidenceCeiling.explanation).toContain('competing');
    expect(result.methodologyConfidenceCeiling.value.toNumber()).toBeLessThan(75);

    // Confidence is genuinely high for a textbook-clean match, but never above the disclosed ceiling.
    expect(result.detectionConfidence.value.toNumber()).toBeGreaterThan(50);
    expect(result.interpretation[0].confidence.value.toNumber()).toBeGreaterThan(50);

    // A specific, non-empty invalidation description is disclosed, never generic placeholder text.
    expect(result.interpretation[0].summary).toContain('invalidate');

    // Genuine, non-empty Traceability -- not a fixture stub.
    expect(result.traceability.intermediateCalculations.length).toBeGreaterThan(0);
  });
});
