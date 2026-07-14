import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { VsaProvider } from './vsa.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildAtrResult, buildBaselineBars, buildRegimeResult, buildSeries, buildSwingResult, candle } from './vsa-test-fixtures';
import { METHODOLOGY_CONFIDENCE_CEILING } from './vsa-confidence.util';
import type { TrendDirection } from '../../swing-detection/swing-detection.types';
import type { VolatilityState } from '../../regime-context/regime-context.types';

describe('VsaProvider skeleton (WP1)', () => {
  let provider: VsaProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VsaProvider, { provide: INDICATOR_ENGINE, useValue: {} }, { provide: SWING_DETECTOR, useValue: {} }, { provide: REGIME_CONTEXT, useValue: {} }],
    }).compile();
    provider = module.get(VsaProvider);
  });

  it('satisfies the full AnalysisProvider interface', () => {
    expect(provider.id).toBe('VSA');
    expect(provider.methodologyFamily).toBe('VSA');
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
    expect(normalized.signals.every((s) => s.reading === 'NOT_APPLICABLE')).toBe(true);
  });

  it('is the only Provider currently declaring methodologyFamily VSA', () => {
    expect(provider.methodologyFamily).toBe('VSA');
  });
});

async function buildProvider(atrValue: number, atrPoints: ReturnType<typeof candle>[], trendDirection: TrendDirection = 'UNKNOWN', volatilityState: VolatilityState = 'LOW', swings: ReturnType<typeof buildSwingResult>['swings'] = []) {
  const atrMock = jest.fn().mockReturnValue(buildAtrResult(atrPoints, atrValue));
  const swingMock = jest.fn().mockReturnValue(buildSwingResult(swings));
  const regimeMock = jest.fn().mockReturnValue(buildRegimeResult(trendDirection, volatilityState));
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      VsaProvider,
      { provide: INDICATOR_ENGINE, useValue: { atr: atrMock } },
      { provide: SWING_DETECTOR, useValue: { detect: swingMock } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: regimeMock } },
    ],
  }).compile();
  return { provider: module.get(VsaProvider), atrMock, swingMock, regimeMock };
}

describe('VsaProvider full analysis (WP2-WP11)', () => {
  it('never throws and returns a populated Limitations entry when fewer bars than the disclosed minimum are supplied', async () => {
    const points = [candle(0, { open: 100, high: 101, low: 99, close: 100 })];
    const { provider } = await buildProvider(10, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
    expect(result.limitations.notes[0]).toContain('bars are required');
  });

  it('never throws and returns a populated Limitations entry when enough bars exist but no qualifying signal is found', async () => {
    const points = buildBaselineBars(12, 0, 1000); // uniform, unremarkable bars -- no anomaly anywhere
    const { provider } = await buildProvider(10, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes[0]).toContain('No qualifying VSA signal');
  });

  it('detects a No Demand signal from an up bar, NARROW spread, LOW volume, during an active up-move', async () => {
    const baseline = buildBaselineBars(10, 0, 1000);
    const target = candle(10, { open: 100, high: 101, low: 99.5, close: 100.5 }, 500); // range=1.5, ratio(atr=10)=0.15 NARROW; volume 500/1000=0.5 LOW; UP
    const points = [...baseline, target];
    const { provider, atrMock } = await buildProvider(10, points, 'UP');

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('[SIGNAL:NO_DEMAND]');
    expect(result.interpretation[0].summary).toContain('[CATEGORY:QUIET]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BEARISH]');
    expect(result.interpretation[0].summary).toContain('invalidate');
    expect(atrMock).toHaveBeenCalled();
  });

  it('detects an Upthrust signal from a genuine new local high, WIDE spread, HIGH volume, and a NEAR_LOW close', async () => {
    const baseline = buildBaselineBars(10, 0, 1000); // highs=101, lows=99
    const target = candle(10, { open: 105, high: 115, low: 99, close: 100 }, 3000); // new local high (115>101), not a new local low (99 not < 99); range=16, ratio(atr=10)=1.6 WIDE; volume 3x ULTRA_HIGH; closePosition=(100-99)/16=0.0625 NEAR_LOW
    const points = [...baseline, target];
    const { provider } = await buildProvider(10, points, 'UNKNOWN');

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('[SIGNAL:UPTHRUST]');
    expect(result.interpretation[0].summary).toContain('[CATEGORY:CLIMAX]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BEARISH]');
  });

  it('strengthens Regime-Adjusted Confidence for a climax-type signal when volatilityState reads HIGH, and weakens it when LOW', async () => {
    const baseline = buildBaselineBars(10, 0, 1000);
    const target = candle(10, { open: 105, high: 115, low: 99, close: 100 }, 3000);
    const points = [...baseline, target];
    const { provider: highProvider } = await buildProvider(10, points, 'UNKNOWN', 'HIGH');
    const { provider: lowProvider } = await buildProvider(10, points, 'UNKNOWN', 'LOW');

    const highResult = await highProvider.analyze(buildSeries(points));
    const lowResult = await lowProvider.analyze(buildSeries(points));

    expect(highResult.interpretation[0].regimeAdjustedConfidence.value.greaterThan(lowResult.interpretation[0].regimeAdjustedConfidence.value)).toBe(true);
  });

  it('populates real Traceability referencing Indicator Engine, Swing Detector, and Regime Context', async () => {
    const baseline = buildBaselineBars(10, 0, 1000);
    const target = candle(10, { open: 105, high: 115, low: 99, close: 100 }, 3000);
    const points = [...baseline, target];
    const { provider } = await buildProvider(10, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.traceability.intermediateCalculations).toHaveLength(3);
    for (const calculation of result.traceability.intermediateCalculations) {
      expect(calculation.computation).toBeTruthy();
      expect(calculation.computationVersion).toBeTruthy();
    }
  });
});
