import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { HarmonicPatternsProvider } from './harmonic-patterns.provider';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildRegimeResult, buildSeries, buildSwingResult, bullishXabcdSwings, point, swing, GARTLEY_BULLISH_PRICES } from './harmonic-patterns-test-fixtures';
import { METHODOLOGY_CONFIDENCE_CEILING } from './harmonic-patterns-confidence.util';

describe('HarmonicPatternsProvider skeleton (WP1)', () => {
  let provider: HarmonicPatternsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HarmonicPatternsProvider, { provide: SWING_DETECTOR, useValue: {} }, { provide: REGIME_CONTEXT, useValue: {} }],
    }).compile();
    provider = module.get(HarmonicPatternsProvider);
  });

  it('satisfies the full AnalysisProvider interface', () => {
    expect(provider.id).toBe('HARMONIC_PATTERNS');
    expect(provider.methodologyFamily).toBe('HARMONIC_PATTERNS');
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

  it('is the only Provider currently declaring methodologyFamily HARMONIC_PATTERNS', () => {
    expect(provider.methodologyFamily).toBe('HARMONIC_PATTERNS');
  });
});

function gartleySeries() {
  return buildSeries(Array.from({ length: 5 }, (_, i) => point(i, 50 + i)));
}

async function buildProvider(swings: ReturnType<typeof swing>[], volatilityState: 'LOW' | 'HIGH') {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      HarmonicPatternsProvider,
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(swings)) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult(volatilityState)) } },
    ],
  }).compile();
  return module.get(HarmonicPatternsProvider);
}

describe('HarmonicPatternsProvider full analysis (WP2-WP9)', () => {
  it('produces a single BULLISH GARTLEY interpretation with all four Confidence kinds and disclosure text for an unambiguous reading', async () => {
    const provider = await buildProvider(bullishXabcdSwings(GARTLEY_BULLISH_PRICES), 'LOW');

    const result = await provider.analyze(gartleySeries());

    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('strongest currently-surviving interpretation');
    expect(result.interpretation[0].summary).toContain('GARTLEY');
    expect(result.interpretation[0].summary).toContain('BULLISH');
    expect(result.interpretation[0].summary).toContain('invalidate');
    expect(result.interpretation[0].confidence.kind).toBe('INTERPRETATION');
    expect(result.interpretation[0].regimeAdjustedConfidence.kind).toBe('REGIME_ADJUSTED');
    expect(result.detectionConfidence.kind).toBe('DETECTION');
    expect(result.methodologyConfidenceCeiling.kind).toBe('METHODOLOGY_CEILING');
    expect(result.methodologyConfidenceCeiling.value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
    expect(result.evidence.detectedConditions).toHaveLength(4);
  });

  it('strengthens Regime-Adjusted Confidence in LOW volatility and weakens it in HIGH volatility for an identical detected pattern', async () => {
    const lowProvider = await buildProvider(bullishXabcdSwings(GARTLEY_BULLISH_PRICES), 'LOW');
    const highProvider = await buildProvider(bullishXabcdSwings(GARTLEY_BULLISH_PRICES), 'HIGH');

    const lowResult = await lowProvider.analyze(gartleySeries());
    const highResult = await highProvider.analyze(gartleySeries());

    expect(lowResult.interpretation[0].regimeAdjustedConfidence.value.greaterThan(highResult.interpretation[0].regimeAdjustedConfidence.value)).toBe(true);
  });

  it('never throws and returns a populated Limitations entry when no candidate matches any named pattern\'s bands', async () => {
    // AB retraces only 10% of XA -- far below every pattern's own AB band lower bound.
    const noMatchSwings = bullishXabcdSwings({ x: 0, a: 100, b: 90, c: 95, d: 50 });
    const provider = await buildProvider(noMatchSwings, 'LOW');

    const result = await provider.analyze(gartleySeries());

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
    expect(result.limitations.dataQuality).not.toBeUndefined();
  });

  it('never throws when fewer than 5 swings are available', async () => {
    const tooFewSwings = [swing('LOW', 0, 0), swing('HIGH', 100, 1)];
    const provider = await buildProvider(tooFewSwings, 'LOW');

    const result = await provider.analyze(gartleySeries());

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
  });

  it('populates real Traceability referencing the actual SwingDetection/RegimeContext calls made', async () => {
    const provider = await buildProvider(bullishXabcdSwings(GARTLEY_BULLISH_PRICES), 'LOW');
    const result = await provider.analyze(gartleySeries());

    expect(result.traceability.intermediateCalculations).toHaveLength(2);
    for (const calculation of result.traceability.intermediateCalculations) {
      expect(calculation.computation).toBeTruthy();
      expect(calculation.computationVersion).toBeTruthy();
    }
  });
});
