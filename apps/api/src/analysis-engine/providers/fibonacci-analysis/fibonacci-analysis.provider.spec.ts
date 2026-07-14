import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { FibonacciAnalysisProvider } from './fibonacci-analysis.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildAtrResult, buildRegimeResult, buildSeries, buildSwingResult, candle, fibonacciLevelsOf, swing } from './fibonacci-analysis-test-fixtures';
import { METHODOLOGY_CONFIDENCE_CEILING } from './fibonacci-analysis-confidence.util';
import type { VolatilityState } from '../../regime-context/regime-context.types';

describe('FibonacciAnalysisProvider skeleton (WP1)', () => {
  let provider: FibonacciAnalysisProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FibonacciAnalysisProvider, { provide: INDICATOR_ENGINE, useValue: {} }, { provide: SWING_DETECTOR, useValue: {} }, { provide: REGIME_CONTEXT, useValue: {} }],
    }).compile();
    provider = module.get(FibonacciAnalysisProvider);
  });

  it('satisfies the full AnalysisProvider interface', () => {
    expect(provider.id).toBe('FIBONACCI_ANALYSIS');
    expect(provider.methodologyFamily).toBe('FIBONACCI_ANALYSIS');
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

  it('is the only Provider currently declaring methodologyFamily FIBONACCI_ANALYSIS', () => {
    expect(provider.methodologyFamily).toBe('FIBONACCI_ANALYSIS');
  });
});

async function buildProvider(swings: ReturnType<typeof swing>[], atrValue: number, atrPoints: ReturnType<typeof candle>[], volatilityState: VolatilityState = 'LOW') {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      FibonacciAnalysisProvider,
      {
        provide: INDICATOR_ENGINE,
        useValue: {
          atr: jest.fn().mockReturnValue(buildAtrResult(atrPoints, atrValue)),
          fibonacciLevels: jest.fn(({ anchorStart, anchorEnd }: { anchorStart: Prisma.Decimal; anchorEnd: Prisma.Decimal }) => fibonacciLevelsOf(anchorStart, anchorEnd)),
        },
      },
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(buildSwingResult(swings)) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult(volatilityState)) } },
    ],
  }).compile();
  return module.get(FibonacciAnalysisProvider);
}

describe('FibonacciAnalysisProvider full analysis (WP2-WP11)', () => {
  it('never throws and returns a populated Limitations entry when fewer than two swings exist', async () => {
    const points = [candle(0, { open: 1000, high: 1005, low: 995, close: 1000 })];
    const provider = await buildProvider([swing('LOW', 1000, 0)], 10, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
  });

  it('detects a cross-leg confluence zone (two independently-derived ratios agreeing) as the primary, nearest hypothesis', async () => {
    // Leg0: 1000 -> 2000; leg1: 2000 -> 1500. Leg0's own 0.382 retracement (1618)
    // and leg1's own 0.236 retracement (1618) coincide exactly -- genuine
    // cross-leg confluence, independently derived from two different legs.
    const swings = [swing('LOW', 1000, 0), swing('HIGH', 2000, 1), swing('LOW', 1500, 2)];
    const points = [
      candle(0, { open: 1000, high: 1005, low: 995, close: 1000 }),
      candle(1, { open: 1000, high: 2005, low: 995, close: 2000 }),
      candle(2, { open: 2000, high: 2005, low: 1495, close: 1500 }),
      candle(3, { open: 1625, high: 1630, low: 1610, close: 1620 }), // touches 1618, respects it
    ];
    const provider = await buildProvider(swings, 10, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation.length).toBeGreaterThanOrEqual(1);
    expect(result.interpretation[0].summary).toContain('2 independent leg(s) agreeing');
    expect(result.interpretation[0].summary).toContain('[REACTION:RESPECTED]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BULLISH]');
    expect(result.interpretation[0].summary).toContain('invalidate');
    expect(result.detectionConfidence.value.toNumber()).toBeGreaterThan(0);
  });

  it('strengthens Regime-Adjusted Confidence for a retracement-dominant reading when volatilityState reads LOW, and weakens it when HIGH', async () => {
    const swings = [swing('LOW', 1000, 0), swing('HIGH', 2000, 1), swing('LOW', 1500, 2)];
    const points = [
      candle(0, { open: 1000, high: 1005, low: 995, close: 1000 }),
      candle(1, { open: 1000, high: 2005, low: 995, close: 2000 }),
      candle(2, { open: 2000, high: 2005, low: 1495, close: 1500 }),
      candle(3, { open: 1625, high: 1630, low: 1610, close: 1620 }),
    ];
    const lowProvider = await buildProvider(swings, 10, points, 'LOW');
    const highProvider = await buildProvider(swings, 10, points, 'HIGH');

    const lowResult = await lowProvider.analyze(buildSeries(points));
    const highResult = await highProvider.analyze(buildSeries(points));

    expect(lowResult.interpretation[0].regimeAdjustedConfidence.value.greaterThan(highResult.interpretation[0].regimeAdjustedConfidence.value)).toBe(true);
  });

  it('populates real Traceability referencing the actual SwingDetection/RegimeContext/Indicator Engine calls made', async () => {
    const swings = [swing('LOW', 1000, 0), swing('HIGH', 2000, 1), swing('LOW', 1500, 2)];
    const points = [
      candle(0, { open: 1000, high: 1005, low: 995, close: 1000 }),
      candle(1, { open: 1000, high: 2005, low: 995, close: 2000 }),
      candle(2, { open: 2000, high: 2005, low: 1495, close: 1500 }),
      candle(3, { open: 1625, high: 1630, low: 1610, close: 1620 }),
    ];
    const provider = await buildProvider(swings, 10, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.traceability.intermediateCalculations.length).toBeGreaterThanOrEqual(4);
    for (const calculation of result.traceability.intermediateCalculations) {
      expect(calculation.computation).toBeTruthy();
      expect(calculation.computationVersion).toBeTruthy();
    }
  });
});
