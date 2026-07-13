import { Test, TestingModule } from '@nestjs/testing';
import { IctSmcProvider } from './ict-smc.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { bosEvent, buildAtrOutput, buildRegimeResult, buildSeries, buildSwingResult, point, swing } from './ict-smc-test-fixtures';

/**
 * SOURCING DISCLOSURE (per S1-010 Sprint Brief, "Golden-Dataset /
 * Reference-Example Conformance Testing" — Scope item 11): unlike a
 * single, well-established institutional curriculum, ICT/SMC vocabulary
 * is taught across a large, decentralized body of modern retail trading
 * education (originating with the "Inner Circle Trader" mentorship
 * material and popularized further by many independent Smart Money
 * Concepts educators) with no single canonical, page-numbered worked
 * example and real definitional variance between sources (S1-010 Sprint
 * Brief, Risks). A specific, citable primary lesson could not be
 * independently obtained in this implementation environment. Per the
 * disclosed-fallback allowance (S1-007/S1-009 precedent), this test
 * instead reproduces the canonical, universally-taught SMC setup every
 * mainstream source agrees on: price sweeps a prior swing low (a
 * liquidity grab/stop hunt), then displaces sharply upward through prior
 * structure (a Break of Structure), leaving a Fair Value Gap in its
 * wake, with the last down-close candle before that impulse marked as
 * the Order Block -- the "liquidity sweep then displacement" narrative
 * this Provider's internal `DisplacementLeg` concept exists to express
 * (Implementation Guidance #1).
 *
 * Exact definitions this Provider implements (disclosed once, here, per
 * Scope item 11 -- see `ict-smc-order-block.detector.ts`,
 * `ict-smc-fvg.detector.ts`, `ict-smc-liquidity-sweep.detector.ts` for
 * the deterministic rules themselves):
 *   Order Block   -- the last opposing-direction candle immediately
 *                     preceding a Displacement Leg's impulse move.
 *   Fair Value Gap -- a three-candle imbalance where candle 1 and candle
 *                     3's wicks do not overlap, above an ATR-relative
 *                     minimum size.
 *   Liquidity Sweep -- a candle piercing beyond a prior swing extreme by
 *                     more than an ATR-relative tolerance, then closing
 *                     back within the prior range (distinct from a
 *                     genuine breakout, which does not close back inside).
 */
describe('IctSmcProvider golden-dataset conformance (S1-010 WP11)', () => {
  it('reproduces the canonical liquidity-sweep-then-displacement bullish setup', async () => {
    // The canonical setup, in its own well-known qualitative terms:
    //   day1 (swing low, 95):    a prior low forms -- the liquidity pool.
    //   day2 (swing high, 106):  a prior high forms -- the level the later impulse must break.
    //   day3 (sweep candle):     price pierces below day1's low, then closes back above it -- the liquidity grab.
    //   day4 (Order Block):     the last down-close candle before the impulse -- also the launch of the Displacement Leg.
    //   day5-day6:               the Displacement Leg itself -- leaves a Fair Value Gap in its wake.
    //   day7 (swing high, 120): breaks above day2's prior high -- the Break of Structure confirming the impulse.
    const points = [
      point(0, { open: 100, high: 101, low: 99, close: 100.5 }),
      point(1, { open: 100, high: 101, low: 95, close: 100 }), // swing low (95) -- the liquidity pool
      point(2, { open: 100, high: 106, low: 99, close: 105 }), // swing high (106) -- prior structure
      point(3, { open: 105, high: 106.2, low: 94, close: 95 }), // the sweep: pierces below 95, closes back at 95
      point(4, { open: 100, high: 101, low: 94, close: 99 }), // the Order Block: bearish, and the Displacement Leg's launch (swing low, 94)
      point(5, { open: 99, high: 108, low: 98, close: 107 }),
      point(6, { open: 107, high: 112, low: 106, close: 111 }),
      point(7, { open: 111, high: 120, low: 110, close: 119 }), // swing high (120) -- the Break of Structure
    ];
    const series = buildSeries(points);

    const swings = [swing('LOW', 95, 1), swing('HIGH', 106, 2), swing('LOW', 94, 4), swing('HIGH', 120, 7)];
    const swingResult = buildSwingResult(swings, [bosEvent('BULLISH', swings[3])]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IctSmcProvider,
        { provide: INDICATOR_ENGINE, useValue: { atr: jest.fn().mockReturnValue(buildAtrOutput(1)) } },
        { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(swingResult) } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('RANGING')) } },
      ],
    }).compile();
    const provider = module.get(IctSmcProvider);

    const result = await provider.analyze(series);

    // The Order Block, both Fair Value Gaps, and the Liquidity Sweep are all detected, all bullish.
    expect(result.evidence.detectedConditions.filter((c) => c.includes('Order Block'))).toHaveLength(1);
    expect(result.evidence.detectedConditions.filter((c) => c.includes('Fair Value Gap'))).toHaveLength(2);
    expect(result.evidence.detectedConditions.filter((c) => c.includes('Liquidity Sweep'))).toHaveLength(1);
    expect(result.evidence.detectedConditions.every((c) => c.startsWith('BULLISH'))).toBe(true);

    // Every bearish category is honestly reported absent -- no bearish evidence was fabricated to force symmetry.
    expect(result.evidence.missingConditions).toEqual(
      expect.arrayContaining(['BEARISH Order Block not detected.', 'BEARISH Fair Value Gap not detected.', 'BEARISH Liquidity Sweep not detected.']),
    );

    // All-bullish evidence is unambiguous: exactly one interpretation, bullish.
    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('Bullish bias');

    // This methodology's disclosed, source-unverified status is stated on every result.
    expect(result.methodologyConfidenceCeiling.explanation).toContain('no independent institutional verification');
    expect(result.methodologyConfidenceCeiling.value.toNumber()).toBeLessThan(85);

    // Genuine, non-empty Traceability -- not a fixture stub.
    expect(result.traceability.intermediateCalculations.length).toBeGreaterThan(0);
  });
});
