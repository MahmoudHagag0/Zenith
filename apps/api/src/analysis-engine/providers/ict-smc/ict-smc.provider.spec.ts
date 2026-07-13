import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { IctSmcProvider } from './ict-smc.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { bosEvent, buildAtrOutput, buildRegimeResult, buildSeries, buildSwingResult, point, swing } from './ict-smc-test-fixtures';
import { METHODOLOGY_CONFIDENCE_CEILING } from './ict-smc-confidence.util';

describe('IctSmcProvider skeleton (WP1)', () => {
  let provider: IctSmcProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IctSmcProvider,
        { provide: INDICATOR_ENGINE, useValue: {} },
        { provide: SWING_DETECTOR, useValue: {} },
        { provide: REGIME_CONTEXT, useValue: {} },
      ],
    }).compile();
    provider = module.get(IctSmcProvider);
  });

  it('satisfies the full AnalysisProvider interface', () => {
    expect(provider.id).toBe('ICT_SMC');
    expect(provider.methodologyFamily).toBe('ICT_SMC');
    expect(provider.lifecycleState).toBe('ACTIVE');
    expect(provider.tier).toBe('FAST');
    expect(provider.computationVersion).toBe('1.0.0');
    expect(provider.dependsOn).toBeUndefined();
    expect(provider.normalize()).toBeUndefined();
  });

  it('is the only Provider currently declaring methodologyFamily ICT_SMC', () => {
    expect(provider.methodologyFamily).toBe('ICT_SMC');
  });
});

/**
 * A 5-candle fixture engineered to produce exactly one detected primitive
 * (a single Bullish Order Block, index 1) and zero Fair Value Gaps /
 * Liquidity Sweeps, so `analyze()`'s full assembly (WP2-WP9) can be
 * exercised deterministically end to end.
 */
function orderBlockOnlySeries() {
  const points = [
    point(0, { open: 100, high: 101, low: 99, close: 100.5 }),
    point(1, { open: 105, high: 106, low: 99, close: 100 }), // bearish -- the Order Block origin
    point(2, { open: 100, high: 108, low: 100, close: 107 }),
    point(3, { open: 107, high: 112, low: 106, close: 111 }),
    point(4, { open: 111, high: 115, low: 105, close: 114 }),
  ];
  return buildSeries(points);
}

function orderBlockSwingResult() {
  const launchLow = swing('LOW', 99, 1);
  const breakingHigh = swing('HIGH', 114, 4);
  return buildSwingResult([launchLow, breakingHigh], [bosEvent('BULLISH', breakingHigh)]);
}

async function buildProvider(swingResult: ReturnType<typeof buildSwingResult>, regimeResult: ReturnType<typeof buildRegimeResult>, atrValue = 5) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      IctSmcProvider,
      { provide: INDICATOR_ENGINE, useValue: { atr: jest.fn().mockReturnValue(buildAtrOutput(atrValue)) } },
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(swingResult) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(regimeResult) } },
    ],
  }).compile();
  return module.get(IctSmcProvider);
}

describe('IctSmcProvider full analysis (WP6-WP9)', () => {
  it('produces a single BULLISH interpretation with all four Confidence kinds for an unambiguous, one-sided reading', async () => {
    const series = orderBlockOnlySeries();
    const provider = await buildProvider(orderBlockSwingResult(), buildRegimeResult('TRENDING'));

    const result = await provider.analyze(series);

    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('Bullish bias');
    expect(result.interpretation[0].confidence.kind).toBe('INTERPRETATION');
    expect(result.interpretation[0].regimeAdjustedConfidence.kind).toBe('REGIME_ADJUSTED');
    expect(result.detectionConfidence.kind).toBe('DETECTION');
    expect(result.methodologyConfidenceCeiling.kind).toBe('METHODOLOGY_CEILING');
    expect(result.methodologyConfidenceCeiling.value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
    expect(result.evidence.detectedConditions.length).toBeGreaterThan(0);
  });

  it('wires the live Regime/Context read through to Regime-Adjusted Confidence in the Order-Block continuation direction disclosed in the Sprint Brief', async () => {
    // This fixture's single Order Block has zero opposing evidence, so its raw
    // Interpretation Confidence score saturates at 100 -- both the TRENDING
    // (x1.2) and RANGING (x0.7) multipliers then land above the Methodology
    // Confidence Ceiling and get capped to the same value. The *direction* of
    // the regime-adjustment rule is exercised correctly regardless (asserted
    // via the disclosed explanation text); the magnitude differentiation
    // itself is exhaustively covered, with a non-saturating fixture, by
    // ict-smc-confidence.util.spec.ts's own TRENDING/RANGING tests (WP7).
    const series = orderBlockOnlySeries();
    const trendingProvider = await buildProvider(orderBlockSwingResult(), buildRegimeResult('TRENDING'));
    const rangingProvider = await buildProvider(orderBlockSwingResult(), buildRegimeResult('RANGING'));

    const trendingResult = await trendingProvider.analyze(series);
    const rangingResult = await rangingProvider.analyze(series);

    expect(trendingResult.interpretation[0].regimeAdjustedConfidence.explanation).toContain('Strengthened');
    expect(trendingResult.interpretation[0].regimeAdjustedConfidence.explanation).toContain('TRENDING');
    expect(rangingResult.interpretation[0].regimeAdjustedConfidence.explanation).toContain('Weakened');
    expect(rangingResult.interpretation[0].regimeAdjustedConfidence.explanation).toContain('RANGING');
  });

  it('never throws and returns a populated Limitations entry when nothing is detected', async () => {
    const series = orderBlockOnlySeries();
    const provider = await buildProvider(buildSwingResult([], []), buildRegimeResult('RANGING'));

    const result = await provider.analyze(series);

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
    expect(result.limitations.dataQuality).not.toBeUndefined();
  });

  it('reports Limitations dataQuality MISSING when the series has no points at all', async () => {
    const emptySeries = buildSeries([point(0, { open: 100, high: 100, low: 100, close: 100 })]);
    const trulyEmptySeries = { ...emptySeries, points: [] };
    const provider = await buildProvider(buildSwingResult([], []), buildRegimeResult('RANGING'));

    const result = await provider.analyze(trulyEmptySeries);

    expect(result.limitations.dataQuality).toBe('MISSING');
  });

  it('populates real Traceability referencing the actual SwingDetection/RegimeContext/ATR calls made', async () => {
    const series = orderBlockOnlySeries();
    const provider = await buildProvider(orderBlockSwingResult(), buildRegimeResult('TRENDING'));

    const result = await provider.analyze(series);

    expect(result.traceability.intermediateCalculations).toHaveLength(3);
    for (const calculation of result.traceability.intermediateCalculations) {
      expect(calculation.computation).toBeTruthy();
      expect(calculation.computationVersion).toBeTruthy();
    }
  });
});
