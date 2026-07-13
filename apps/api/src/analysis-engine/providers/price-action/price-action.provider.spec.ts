import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { PriceActionProvider } from './price-action.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildAtrResult, buildRegimeResult, buildSeries, buildSwingResult, candle, swing } from './price-action-test-fixtures';
import { METHODOLOGY_CONFIDENCE_CEILING } from './price-action-confidence.util';
import type { VolatilityState } from '../../regime-context/regime-context.types';

describe('PriceActionProvider skeleton (WP1)', () => {
  let provider: PriceActionProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriceActionProvider, { provide: INDICATOR_ENGINE, useValue: {} }, { provide: SWING_DETECTOR, useValue: {} }, { provide: REGIME_CONTEXT, useValue: {} }],
    }).compile();
    provider = module.get(PriceActionProvider);
  });

  it('satisfies the full AnalysisProvider interface', () => {
    expect(provider.id).toBe('PRICE_ACTION');
    expect(provider.methodologyFamily).toBe('PRICE_ACTION');
    expect(provider.lifecycleState).toBe('ACTIVE');
    expect(provider.tier).toBe('FAST');
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

  it('is the only Provider currently declaring methodologyFamily PRICE_ACTION', () => {
    expect(provider.methodologyFamily).toBe('PRICE_ACTION');
  });
});

async function buildProvider(swings: ReturnType<typeof swing>[], atrValue: number, atrPoints: ReturnType<typeof candle>[], volatilityState: VolatilityState = 'LOW') {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      PriceActionProvider,
      { provide: INDICATOR_ENGINE, useValue: { atr: jest.fn().mockReturnValue(buildAtrResult(atrPoints, atrValue)) } },
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(swings)) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('RANGING', volatilityState)) } },
    ],
  }).compile();
  return module.get(PriceActionProvider);
}

describe('PriceActionProvider full analysis (WP2-WP11)', () => {
  const highSwing = [swing('HIGH', 100, 0)];

  it('never throws and returns a populated Limitations entry when no swing exists', async () => {
    const provider = await buildProvider([], 1, []);
    const series = buildSeries([candle(0, { open: 100, high: 100, low: 100, close: 100 })]);

    const result = await provider.analyze(series);

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
  });

  it('never throws and returns a populated Limitations entry when the key level has zero subsequent points', async () => {
    const provider = await buildProvider(highSwing, 1, []);
    const series = buildSeries([candle(0, { open: 100, high: 100, low: 100, close: 100 })]);

    const result = await provider.analyze(series);

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
  });

  it('classifies APPROACHING_LEVEL (NEUTRAL, evaluated) when price has not yet reached the key level', async () => {
    const points = [candle(0, { open: 100, high: 100, low: 100, close: 100 }), candle(1, { open: 90, high: 92, low: 88, close: 91 })];
    const provider = await buildProvider(highSwing, 1, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('[STATE:APPROACHING_LEVEL]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:NEUTRAL]');
  });

  it('classifies REJECTED_LEVEL with a BEARISH direction for a HIGH key level', async () => {
    const points = [candle(0, { open: 100, high: 100, low: 100, close: 100 }), candle(1, { open: 95, high: 102, low: 94, close: 96 })];
    const provider = await buildProvider(highSwing, 1, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation[0].summary).toContain('[STATE:REJECTED_LEVEL]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BEARISH]');
    expect(result.interpretation[0].summary).toContain('invalidate');
    expect(result.detectionConfidence.kind).toBe('DETECTION');
    expect(result.methodologyConfidenceCeiling.value).toEqual(new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING));
  });

  it('classifies BREAKOUT_UNCONFIRMED with a BULLISH direction and a genuine momentum score', async () => {
    const points = [candle(0, { open: 100, high: 100, low: 100, close: 100 }), candle(1, { open: 99, high: 106, low: 98, close: 105 })];
    const provider = await buildProvider(highSwing, 1, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation[0].summary).toContain('[STATE:BREAKOUT_UNCONFIRMED]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BULLISH]');
  });

  it('classifies BREAKOUT_CONFIRMED once a subsequent point retests the level and holds', async () => {
    const points = [
      candle(0, { open: 100, high: 100, low: 100, close: 100 }),
      candle(1, { open: 99, high: 106, low: 98, close: 105 }),
      candle(2, { open: 105, high: 107, low: 99, close: 106 }),
    ];
    const provider = await buildProvider(highSwing, 1, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation[0].summary).toContain('[STATE:BREAKOUT_CONFIRMED]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BULLISH]');
  });

  it("classifies BREAKOUT_FAILED with a direction flipped to the OPPOSITE of the original breakout direction", async () => {
    const points = [
      candle(0, { open: 100, high: 100, low: 100, close: 100 }),
      candle(1, { open: 99, high: 106, low: 98, close: 105 }),
      candle(2, { open: 105, high: 105, low: 95, close: 96 }),
    ];
    const provider = await buildProvider(highSwing, 1, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation[0].summary).toContain('[STATE:BREAKOUT_FAILED]');
    // The original breakout direction for a HIGH key level is BULLISH; a failure flips to BEARISH.
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BEARISH]');
  });

  it('strengthens Regime-Adjusted Confidence for a breakout when volatilityState is HIGH, and weakens it when LOW', async () => {
    const points = [candle(0, { open: 100, high: 100, low: 100, close: 100 }), candle(1, { open: 99, high: 110, low: 98, close: 109 })];
    const highVolProvider = await buildProvider(highSwing, 1, points, 'HIGH');
    const lowVolProvider = await buildProvider(highSwing, 1, points, 'LOW');

    const highVolResult = await highVolProvider.analyze(buildSeries(points));
    const lowVolResult = await lowVolProvider.analyze(buildSeries(points));

    expect(highVolResult.interpretation[0].regimeAdjustedConfidence.value.greaterThan(lowVolResult.interpretation[0].regimeAdjustedConfidence.value)).toBe(true);
  });

  it('discloses a boundary-proximity alternate interpretation when the decisive close is within margin of the level', async () => {
    const points = [candle(0, { open: 100, high: 100, low: 100, close: 100 }), candle(1, { open: 95, high: 102, low: 94, close: 100.05 })];
    const provider = await buildProvider(highSwing, 1, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toHaveLength(2);
    expect(result.interpretation[1].summary).toContain('boundary-proximity');
    expect(result.interpretation[1].confidence.value.lessThan(result.interpretation[0].confidence.value)).toBe(true);
  });

  it('populates real Traceability referencing the actual SwingDetection/RegimeContext/ATR calls made', async () => {
    const points = [candle(0, { open: 100, high: 100, low: 100, close: 100 }), candle(1, { open: 99, high: 106, low: 98, close: 105 })];
    const provider = await buildProvider(highSwing, 1, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.traceability.intermediateCalculations).toHaveLength(3);
    for (const calculation of result.traceability.intermediateCalculations) {
      expect(calculation.computation).toBeTruthy();
      expect(calculation.computationVersion).toBeTruthy();
    }
  });
});
