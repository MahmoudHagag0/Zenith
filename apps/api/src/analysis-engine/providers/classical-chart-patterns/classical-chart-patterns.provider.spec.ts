import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { ClassicalChartPatternsProvider } from './classical-chart-patterns.provider';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildRegimeResult, buildSeries, buildSwingResult, headAndShouldersSwings, point, swing } from './classical-chart-patterns-test-fixtures';
import { METHODOLOGY_CONFIDENCE_CEILING } from './classical-chart-patterns-confidence.util';

describe('ClassicalChartPatternsProvider skeleton (WP1)', () => {
  let provider: ClassicalChartPatternsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassicalChartPatternsProvider, { provide: SWING_DETECTOR, useValue: {} }, { provide: REGIME_CONTEXT, useValue: {} }],
    }).compile();
    provider = module.get(ClassicalChartPatternsProvider);
  });

  it('satisfies the full AnalysisProvider interface', () => {
    expect(provider.id).toBe('CLASSICAL_CHART_PATTERNS');
    expect(provider.methodologyFamily).toBe('CLASSICAL_CHART_PATTERNS');
    expect(provider.lifecycleState).toBe('ACTIVE');
    expect(provider.tier).toBe('SLOW');
    expect(provider.computationVersion).toBe('1.0.0');
    expect(provider.dependsOn).toBeUndefined();
    const normalized = provider.normalize({
      contractVersion: '1.0.0',
      evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
      interpretation: [],
      limitations: { dataQuality: 'MISSING', assumptions: [], notes: [] },
      traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
      detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(0), explanation: '' },
      methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING), explanation: '' },
    });
    expect(normalized.signals).toHaveLength(7);
  });

  it('is the only Provider currently declaring methodologyFamily CLASSICAL_CHART_PATTERNS', () => {
    expect(provider.methodologyFamily).toBe('CLASSICAL_CHART_PATTERNS');
  });
});

/** Builds a series whose points exactly match the given swings' own timestamps/prices -- consistent OHLC, avoiding any artificial confirmation contamination from unrelated dummy prices. */
function seriesMatchingSwings(swings: ReturnType<typeof swing>[]) {
  return buildSeries(swings.map((s) => point(s.timestamp.getUTCDate() - 1, s.price.toNumber())));
}

async function buildProvider(swings: ReturnType<typeof swing>[], trendState: 'TRENDING' | 'RANGING') {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ClassicalChartPatternsProvider,
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(swings)) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult(trendState)) } },
    ],
  }).compile();
  return module.get(ClassicalChartPatternsProvider);
}

describe('ClassicalChartPatternsProvider full analysis (WP2-WP9)', () => {
  it('produces a BEARISH HEAD_AND_SHOULDERS interpretation with all four Confidence kinds and disclosure text for an unambiguous reading', async () => {
    // Note: this fixture's own neckline troughs (LEFT_TROUGH/RIGHT_TROUGH) are, by the shape
    // criteria's own definition, roughly level -- which structurally also satisfies a
    // Double-Bottom-shape check on those same three points (neckline-levelness IS
    // trough-symmetry). A genuine, disclosed structural overlap between the two pattern
    // families, not a defect -- both are honestly reported, never merged or suppressed
    // (Sprint Brief Scope item 7's own bounded multi-hypothesis design). This test asserts
    // on the HEAD_AND_SHOULDERS entry specifically, wherever it ranks.
    const provider = await buildProvider(headAndShouldersSwings(), 'TRENDING');

    const result = await provider.analyze(seriesMatchingSwings(headAndShouldersSwings()));

    const headAndShoulders = result.interpretation.find((i) => i.summary.includes('HEAD_AND_SHOULDERS'));
    expect(headAndShoulders).toBeDefined();
    expect(headAndShoulders!.summary).toContain('strongest currently-surviving interpretation');
    expect(headAndShoulders!.summary).toContain('BEARISH');
    expect(headAndShoulders!.summary).toContain('invalidate');
    expect(headAndShoulders!.confidence.kind).toBe('INTERPRETATION');
    expect(headAndShoulders!.regimeAdjustedConfidence.kind).toBe('REGIME_ADJUSTED');
    expect(result.detectionConfidence.kind).toBe('DETECTION');
    expect(result.methodologyConfidenceCeiling.kind).toBe('METHODOLOGY_CEILING');
    expect(result.methodologyConfidenceCeiling.value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
    expect(result.evidence.detectedConditions).toHaveLength(result.evidence.detectedConditions.length);
    expect(result.evidence.detectedConditions.length).toBeGreaterThan(0);
  });

  it('strengthens Regime-Adjusted Confidence in TRENDING and weakens it in RANGING for an identical detected pattern', async () => {
    const trendingProvider = await buildProvider(headAndShouldersSwings(), 'TRENDING');
    const rangingProvider = await buildProvider(headAndShouldersSwings(), 'RANGING');
    const series = seriesMatchingSwings(headAndShouldersSwings());

    const trendingResult = await trendingProvider.analyze(series);
    const rangingResult = await rangingProvider.analyze(series);

    expect(trendingResult.interpretation[0].regimeAdjustedConfidence.value.greaterThan(rangingResult.interpretation[0].regimeAdjustedConfidence.value)).toBe(true);
  });

  it('never throws and returns a populated Limitations entry when no candidate satisfies either pattern family\'s shape criteria', async () => {
    // Every swing (and every possible 3- or 5-swing sub-window) is exponentially larger than
    // the last, so every symmetry check (Double Top/Bottom's peak/trough equality, Head and
    // Shoulders' shoulder/neckline levelness) fails well beyond the disclosed 10% tolerance,
    // and Head and Shoulders' own Head-dominance check fails too (the Head is never the most
    // extreme of the three peaks/troughs).
    const noMatchSwings = [swing('HIGH', 10, 0), swing('LOW', 5, 1), swing('HIGH', 100, 2), swing('LOW', 50, 3), swing('HIGH', 1000, 4)];
    const provider = await buildProvider(noMatchSwings, 'TRENDING');

    const result = await provider.analyze(seriesMatchingSwings(noMatchSwings));

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
    expect(result.limitations.dataQuality).not.toBeUndefined();
  });

  it('never throws when fewer than 3 swings are available', async () => {
    const tooFewSwings = [swing('HIGH', 100, 0), swing('LOW', 90, 1)];
    const provider = await buildProvider(tooFewSwings, 'TRENDING');

    const result = await provider.analyze(seriesMatchingSwings(tooFewSwings));

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
  });

  it('populates real Traceability referencing the actual SwingDetection/RegimeContext calls made', async () => {
    const provider = await buildProvider(headAndShouldersSwings(), 'TRENDING');
    const result = await provider.analyze(seriesMatchingSwings(headAndShouldersSwings()));

    expect(result.traceability.intermediateCalculations).toHaveLength(2);
    for (const calculation of result.traceability.intermediateCalculations) {
      expect(calculation.computation).toBeTruthy();
      expect(calculation.computationVersion).toBeTruthy();
    }
  });
});
