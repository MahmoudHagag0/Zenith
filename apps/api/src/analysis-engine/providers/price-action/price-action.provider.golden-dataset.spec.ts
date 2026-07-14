import { Test, TestingModule } from '@nestjs/testing';
import { PriceActionProvider } from './price-action.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildAtrResult, buildRegimeResult, buildSeries, buildSwingResult, candle, swing } from './price-action-test-fixtures';

/**
 * SOURCING DISCLOSURE (per S1-015 Sprint Brief, "Golden-Dataset /
 * Reference-Example Conformance Testing" — Scope item 14): unlike other
 * registered methodologies, each of which already discloses its own
 * reliance (in its own respective sprint) on a single, individually-
 * authored canonical text, this methodology's own defining concepts
 * (rejection strength, breakout quality, retest quality, continuation
 * versus exhaustion) are broadly corroborated across many decentralized,
 * independently-authored sources rather than one single canonical
 * reference that could be cited and could not be obtained. Per the
 * disclosed-fallback allowance established at every prior Provider
 * sprint, these two tests instead reproduce the widely-taught
 * qualitative instances every independent source on this subject agrees
 * on: a decisive breakout that is subsequently retested and holds, and a
 * clean rejection with a dominant opposing wick -- verifying
 * `PriceActionProvider` reproduces both end-to-end, not a specific
 * numbered figure from any one text.
 */
describe('PriceActionProvider golden-dataset conformance (S1-015 WP13)', () => {
  it('reproduces the canonical breakout-and-successful-retest instance: a decisive close beyond resistance, later retested and held', async () => {
    // Key level: a prior swing HIGH at 100 (resistance).
    //   Day 1: a decisive close at 108, well beyond the level -- the breakout bar.
    //   Day 2: price pulls back, wicking down to 99 (touching the old resistance,
    //     now expected support) but closing at 107, well above it -- the retest holds.
    //   Day 3-4: price continues higher with expanding bodies -- genuine continuation,
    //     not exhaustion.
    const keyLevelSwing = [swing('HIGH', 100, 0)];
    const points = [
      candle(0, { open: 99, high: 100, low: 98, close: 99 }),
      candle(1, { open: 100, high: 109, low: 99.5, close: 108 }),
      candle(2, { open: 108, high: 109, low: 99, close: 107 }),
      candle(3, { open: 107, high: 115, low: 106, close: 114 }),
      candle(4, { open: 114, high: 123, low: 113, close: 122 }),
    ];
    const series = buildSeries(points);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceActionProvider,
        { provide: INDICATOR_ENGINE, useValue: { atr: jest.fn().mockReturnValue(buildAtrResult(points, 2)) } },
        { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(keyLevelSwing)) } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('TRENDING', 'HIGH')) } },
      ],
    }).compile();
    const provider = module.get(PriceActionProvider);

    const result = await provider.analyze(series);

    expect(result.interpretation[0].summary).toContain('[STATE:BREAKOUT_CONFIRMED]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BULLISH]');
    expect(result.interpretation[0].summary).toContain('strongest currently-surviving interpretation');
    expect(result.interpretation[0].summary).toContain('invalidate');

    // A genuinely continuing move: later bars have larger bodies than earlier ones.
    expect(result.interpretation[0].summary).toContain('CONTINUATION');

    expect(result.detectionConfidence.value.toNumber()).toBeGreaterThan(50);
    expect(result.methodologyConfidenceCeiling.explanation.length).toBeGreaterThan(0);
    expect(result.traceability.intermediateCalculations.length).toBe(3);
    expect(result.evidence.detectedConditions.length).toBeGreaterThan(0);
  });

  it('reproduces the canonical clean-rejection instance: a dominant opposing wick at resistance with no confirming close beyond it', async () => {
    // Key level: a prior swing HIGH at 100 (resistance).
    //   Day 1: price wicks decisively above the level to 106 but is rejected, closing
    //     back down at 91 -- a long upper wick dominating the bar's own range.
    const keyLevelSwing = [swing('HIGH', 100, 0)];
    const points = [candle(0, { open: 99, high: 100, low: 98, close: 99 }), candle(1, { open: 92, high: 106, low: 90, close: 91 })];
    const series = buildSeries(points);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceActionProvider,
        { provide: INDICATOR_ENGINE, useValue: { atr: jest.fn().mockReturnValue(buildAtrResult(points, 2)) } },
        { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(keyLevelSwing)) } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('RANGING', 'LOW')) } },
      ],
    }).compile();
    const provider = module.get(PriceActionProvider);

    const result = await provider.analyze(series);

    expect(result.interpretation[0].summary).toContain('[STATE:REJECTED_LEVEL]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BEARISH]');
    expect(result.interpretation[0].summary).toContain('invalidate');

    // A textbook-clean rejection: the wick dominates the bar's own range.
    expect(result.detectionConfidence.value.toNumber()).toBeGreaterThan(50);
    expect(result.interpretation[0].confidence.value.toNumber()).toBeGreaterThan(50);
    expect(result.traceability.intermediateCalculations.length).toBe(3);
  });
});
