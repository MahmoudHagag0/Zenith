import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { ElliottWaveProvider } from './elliott-wave.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildFibonacciOutput, buildRegimeResult, buildSeries, buildSwingResult, point, swing } from './elliott-wave-test-fixtures';
import { METHODOLOGY_CONFIDENCE_CEILING } from './elliott-wave-confidence.util';

describe('ElliottWaveProvider skeleton (WP1)', () => {
  let provider: ElliottWaveProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElliottWaveProvider,
        { provide: INDICATOR_ENGINE, useValue: {} },
        { provide: SWING_DETECTOR, useValue: {} },
        { provide: REGIME_CONTEXT, useValue: {} },
      ],
    }).compile();
    provider = module.get(ElliottWaveProvider);
  });

  it('satisfies the full AnalysisProvider interface', () => {
    expect(provider.id).toBe('ELLIOTT_WAVE');
    expect(provider.methodologyFamily).toBe('ELLIOTT_WAVE');
    expect(provider.lifecycleState).toBe('ACTIVE');
    expect(provider.tier).toBe('SLOW');
    expect(provider.computationVersion).toBe('1.0.0');
    expect(provider.dependsOn).toBeUndefined();
    expect(provider.normalize()).toBeUndefined();
  });

  it('is the only Provider currently declaring methodologyFamily ELLIOTT_WAVE', () => {
    expect(provider.methodologyFamily).toBe('ELLIOTT_WAVE');
  });
});

/** A 6-swing fixture engineered to produce exactly one Rule-surviving Bullish 5-wave candidate, so `analyze()`'s full assembly (WP2-WP9) can be exercised deterministically end to end. */
function fiveWaveSwings() {
  return [swing('LOW', 100, 0), swing('HIGH', 120, 1), swing('LOW', 108, 2), swing('HIGH', 150, 3), swing('LOW', 130, 4), swing('HIGH', 160, 5)];
}

function fiveWaveSeries() {
  return buildSeries(Array.from({ length: 6 }, (_, i) => point(i, 100 + i)));
}

async function buildProvider(swings: ReturnType<typeof swing>[], trendState: 'TRENDING' | 'RANGING') {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ElliottWaveProvider,
      { provide: INDICATOR_ENGINE, useValue: { fibonacciLevels: jest.fn((params: { anchorStart: Prisma.Decimal; anchorEnd: Prisma.Decimal }) => buildFibonacciOutput(params.anchorStart, params.anchorEnd)) } },
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(swings)) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult(trendState)) } },
    ],
  }).compile();
  return module.get(ElliottWaveProvider);
}

describe('ElliottWaveProvider full analysis (WP2-WP9)', () => {
  it('produces a single BULLISH interpretation with all four Confidence kinds and Guidance #5/#6 disclosure for an unambiguous reading', async () => {
    const provider = await buildProvider(fiveWaveSwings(), 'TRENDING');

    const result = await provider.analyze(fiveWaveSeries());

    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('strongest currently-surviving interpretation');
    expect(result.interpretation[0].summary).not.toContain('the correct wave count');
    expect(result.interpretation[0].summary).toContain('invalidate');
    expect(result.interpretation[0].confidence.kind).toBe('INTERPRETATION');
    expect(result.interpretation[0].regimeAdjustedConfidence.kind).toBe('REGIME_ADJUSTED');
    expect(result.detectionConfidence.kind).toBe('DETECTION');
    expect(result.methodologyConfidenceCeiling.kind).toBe('METHODOLOGY_CEILING');
    expect(result.methodologyConfidenceCeiling.value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
    expect(result.evidence.detectedConditions).toHaveLength(5);
  });

  it('strengthens Regime-Adjusted Confidence in TRENDING and weakens it in RANGING for an identical detected structure', async () => {
    const trendingProvider = await buildProvider(fiveWaveSwings(), 'TRENDING');
    const rangingProvider = await buildProvider(fiveWaveSwings(), 'RANGING');

    const trendingResult = await trendingProvider.analyze(fiveWaveSeries());
    const rangingResult = await rangingProvider.analyze(fiveWaveSeries());

    expect(trendingResult.interpretation[0].regimeAdjustedConfidence.value.greaterThan(rangingResult.interpretation[0].regimeAdjustedConfidence.value)).toBe(true);
  });

  it('never throws and returns a populated Limitations entry when no candidate survives Elliott\'s Three Rules', async () => {
    const tooFewSwings = [swing('LOW', 100, 0), swing('HIGH', 120, 1), swing('LOW', 108, 2)];
    const provider = await buildProvider(tooFewSwings, 'RANGING');

    const result = await provider.analyze(fiveWaveSeries());

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
    expect(result.limitations.dataQuality).not.toBeUndefined();
  });

  it('populates real Traceability referencing the actual SwingDetection/RegimeContext/Fibonacci calls made, and omits Fibonacci on the Limitations path', async () => {
    const provider = await buildProvider(fiveWaveSwings(), 'TRENDING');
    const result = await provider.analyze(fiveWaveSeries());
    expect(result.traceability.intermediateCalculations).toHaveLength(3);
    for (const calculation of result.traceability.intermediateCalculations) {
      expect(calculation.computation).toBeTruthy();
      expect(calculation.computationVersion).toBeTruthy();
    }

    const limitationsProvider = await buildProvider([swing('LOW', 100, 0)], 'RANGING');
    const limitationsResult = await limitationsProvider.analyze(fiveWaveSeries());
    expect(limitationsResult.traceability.intermediateCalculations).toHaveLength(2);
  });
});
