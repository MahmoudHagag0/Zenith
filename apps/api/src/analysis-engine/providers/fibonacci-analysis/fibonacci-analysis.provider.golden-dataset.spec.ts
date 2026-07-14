import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { FibonacciAnalysisProvider } from './fibonacci-analysis.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildAtrResult, buildRegimeResult, buildSeries, buildSwingResult, candle, fibonacciLevelsOf, swing } from './fibonacci-analysis-test-fixtures';

/**
 * SOURCING DISCLOSURE (per S1-017 Sprint Brief, "Golden-Dataset /
 * Reference-Example Conformance Testing" — Scope item 13): the
 * underlying ratio mathematics have an unusually solid, precisely-dated
 * primary source (Leonardo of Pisa's "Liber Abaci," 1202, already cited
 * by the Indicator Engine's own Fibonacci calculator) -- but, like other
 * registered methodologies, each of which already discloses its own
 * reliance (in its own respective sprint) on a single, individually-
 * authored canonical *trading-application* text, no single canonical
 * trading-application text exists for confluence-zone theory itself; it
 * is taught across many decentralized, independently-authored retail-
 * trading sources with genuine terminology variance but unusually high
 * cross-source agreement on the core concepts: independently-derived
 * retracement/extension ratios that cluster at the same price are a
 * stronger support/resistance claim than any single ratio alone; an
 * untested or already-respected level is a live, valid claim; a
 * decisively broken level invalidates it. These two tests reproduce
 * those widely-taught qualitative instances end-to-end, not a specific
 * numbered figure from any one text.
 */
describe('FibonacciAnalysisProvider golden-dataset conformance (S1-017 WP13)', () => {
  it('reproduces the canonical confluence-zone-respected instance: two independently-derived ratios agreeing at a level that has since held', async () => {
    // Leg 0 (day 0 -> day 1, 1000 -> 2000): the 0.382 retracement lands at 1618.
    // Leg 1 (day 1 -> day 2, 2000 -> 1500): the 0.236 retracement also lands at
    // 1618 -- two independently-derived ratios, from two different legs,
    // agreeing exactly: genuine confluence, not coincidence within a single
    // leg's own ratio spacing. Day 3 touches 1618 and closes back above it --
    // RESPECTED.
    const swings = [swing('LOW', 1000, 0), swing('HIGH', 2000, 1), swing('LOW', 1500, 2)];
    const points = [
      candle(0, { open: 1000, high: 1005, low: 995, close: 1000 }),
      candle(1, { open: 1000, high: 2005, low: 995, close: 2000 }),
      candle(2, { open: 2000, high: 2005, low: 1495, close: 1500 }),
      candle(3, { open: 1625, high: 1630, low: 1610, close: 1620 }),
    ];
    const series = buildSeries(points);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FibonacciAnalysisProvider,
        {
          provide: INDICATOR_ENGINE,
          useValue: {
            atr: jest.fn().mockReturnValue(buildAtrResult(points, 10)),
            fibonacciLevels: jest.fn(({ anchorStart, anchorEnd }: { anchorStart: Prisma.Decimal; anchorEnd: Prisma.Decimal }) => fibonacciLevelsOf(anchorStart, anchorEnd)),
          },
        },
        { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(swings)) } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('LOW')) } },
      ],
    }).compile();
    const provider = module.get(FibonacciAnalysisProvider);

    const result = await provider.analyze(series);

    expect(result.interpretation[0].summary).toContain('2 independent leg(s) agreeing');
    expect(result.interpretation[0].summary).toContain('[REACTION:RESPECTED]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BULLISH]');
    expect(result.interpretation[0].summary).toContain('strongest currently-surviving interpretation');
    expect(result.interpretation[0].summary).toContain('invalidate');

    expect(result.detectionConfidence.value.toNumber()).toBeGreaterThan(50);
    expect(result.interpretation[0].confidence.value.toNumber()).toBeGreaterThan(50);
    expect(result.methodologyConfidenceCeiling.explanation.length).toBeGreaterThan(0);
    expect(result.traceability.intermediateCalculations.length).toBeGreaterThanOrEqual(4);
  });

  it('reproduces the canonical broken-level instance: a confluence zone first respected, then decisively closed through -- the disclosed bias flip', async () => {
    // Same confluence zone (1618, two independent legs agreeing). Day 3
    // touches and closes above 1618 (establishing it as support, held
    // initially); day 4 then closes decisively below it -- BROKEN, and this
    // reading's own bias flips from BULLISH (support) to BEARISH (broken).
    const swings = [swing('LOW', 1000, 0), swing('HIGH', 2000, 1), swing('LOW', 1500, 2)];
    const points = [
      candle(0, { open: 1000, high: 1005, low: 995, close: 1000 }),
      candle(1, { open: 1000, high: 2005, low: 995, close: 2000 }),
      candle(2, { open: 2000, high: 2005, low: 1495, close: 1500 }),
      candle(3, { open: 1625, high: 1630, low: 1610, close: 1620 }),
      candle(4, { open: 1620, high: 1622, low: 1608, close: 1610 }),
    ];
    const series = buildSeries(points);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FibonacciAnalysisProvider,
        {
          provide: INDICATOR_ENGINE,
          useValue: {
            atr: jest.fn().mockReturnValue(buildAtrResult(points, 10)),
            fibonacciLevels: jest.fn(({ anchorStart, anchorEnd }: { anchorStart: Prisma.Decimal; anchorEnd: Prisma.Decimal }) => fibonacciLevelsOf(anchorStart, anchorEnd)),
          },
        },
        { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(swings)) } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('HIGH')) } },
      ],
    }).compile();
    const provider = module.get(FibonacciAnalysisProvider);

    const result = await provider.analyze(series);

    expect(result.interpretation[0].summary).toContain('2 independent leg(s) agreeing');
    expect(result.interpretation[0].summary).toContain('[REACTION:BROKEN]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BEARISH]');
    expect(result.interpretation[0].summary).toContain('failing');
    expect(result.interpretation[0].summary).toContain('invalidate');

    // A level that has already broken once reads at a materially lower Interpretation Confidence than its own Detection Confidence.
    expect(result.interpretation[0].confidence.value.toNumber()).toBeLessThan(result.detectionConfidence.value.toNumber());
    expect(result.traceability.intermediateCalculations.length).toBeGreaterThanOrEqual(4);
  });
});
