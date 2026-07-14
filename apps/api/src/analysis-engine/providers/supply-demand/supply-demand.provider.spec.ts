import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { SupplyDemandProvider } from './supply-demand.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildAtrResult, buildRegimeResult, buildSeries, candle } from './supply-demand-test-fixtures';
import { METHODOLOGY_CONFIDENCE_CEILING } from './supply-demand-confidence.util';
import type { TrendDirection } from '../../swing-detection/swing-detection.types';

describe('SupplyDemandProvider skeleton (WP1)', () => {
  let provider: SupplyDemandProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplyDemandProvider, { provide: INDICATOR_ENGINE, useValue: {} }, { provide: REGIME_CONTEXT, useValue: {} }],
    }).compile();
    provider = module.get(SupplyDemandProvider);
  });

  it('satisfies the full AnalysisProvider interface', () => {
    expect(provider.id).toBe('SUPPLY_DEMAND');
    expect(provider.methodologyFamily).toBe('SUPPLY_DEMAND');
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

  it('is the only Provider currently declaring methodologyFamily SUPPLY_DEMAND', () => {
    expect(provider.methodologyFamily).toBe('SUPPLY_DEMAND');
  });
});

async function buildProvider(atrValue: number, atrPoints: ReturnType<typeof candle>[], trendDirection: TrendDirection = 'UNKNOWN') {
  const atrMock = jest.fn().mockReturnValue(buildAtrResult(atrPoints, atrValue));
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      SupplyDemandProvider,
      { provide: INDICATOR_ENGINE, useValue: { atr: atrMock } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult(trendDirection)) } },
    ],
  }).compile();
  return { provider: module.get(SupplyDemandProvider), atrMock };
}

describe('SupplyDemandProvider full analysis (WP2-WP11)', () => {
  it('never throws and returns a populated Limitations entry when no base-and-departure candidate exists', async () => {
    const points = [candle(0, { open: 100, high: 100, low: 100, close: 100 }), candle(1, { open: 100, high: 100, low: 100, close: 100 })];
    const { provider } = await buildProvider(1, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
  });

  it('detects both a DEMAND zone and a SUPPLY zone, bounded at one hypothesis per side, nearer one primary', async () => {
    const points = [
      candle(0, { open: 110, high: 111, low: 104, close: 105 }), // preceding: DROP
      candle(1, { open: 105, high: 106, low: 104, close: 104.5 }), // base 1: tight
      candle(2, { open: 104.5, high: 112.5, low: 104, close: 112 }), // departure 1: DEMAND
      candle(3, { open: 112, high: 120, low: 111, close: 119 }), // filler (decisive, never a base)
      candle(4, { open: 119, high: 125.5, low: 118.5, close: 125 }), // preceding: RALLY
      candle(5, { open: 125, high: 126, low: 124.8, close: 125.4 }), // base 2: tight
      candle(6, { open: 125.4, high: 126, low: 117, close: 118 }), // departure 2: SUPPLY
      candle(7, { open: 120, high: 121, low: 119, close: 120 }), // current price point
    ];
    const { provider, atrMock } = await buildProvider(2, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toHaveLength(2);
    expect(result.interpretation[0].summary).toContain('[TYPE:SUPPLY]'); // nearer to current price (120)
    expect(result.interpretation[1].summary).toContain('[TYPE:DEMAND]');
    expect(result.interpretation[0].summary).toContain('[FRESHNESS:FRESH]');
    expect(result.interpretation[0].summary).toContain('[MITIGATION:UNMITIGATED]');
    expect(result.interpretation[0].summary).toContain('invalidate');
    expect(atrMock).toHaveBeenCalled();
  });

  it('returns exactly one hypothesis when only one side is present', async () => {
    const points = [
      candle(0, { open: 110, high: 111, low: 104, close: 105 }),
      candle(1, { open: 105, high: 106, low: 104, close: 104.5 }),
      candle(2, { open: 104.5, high: 112.5, low: 104, close: 112 }),
      candle(3, { open: 112, high: 113, low: 111.5, close: 112.5 }),
    ];
    const { provider } = await buildProvider(2, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('[TYPE:DEMAND]');
    expect(result.evidence.missingConditions.some((m) => m.includes('SUPPLY'))).toBe(true);
  });

  it('strengthens Regime-Adjusted Confidence for a DEMAND zone when trendDirection reads UP, and weakens it when DOWN', async () => {
    const points = [
      candle(0, { open: 110, high: 111, low: 104, close: 105 }),
      candle(1, { open: 105, high: 106, low: 104, close: 104.5 }),
      candle(2, { open: 104.5, high: 112.5, low: 104, close: 112 }),
      candle(3, { open: 112, high: 113, low: 111.5, close: 112.5 }),
    ];
    const { provider: upProvider } = await buildProvider(2, points, 'UP');
    const { provider: downProvider } = await buildProvider(2, points, 'DOWN');

    const upResult = await upProvider.analyze(buildSeries(points));
    const downResult = await downProvider.analyze(buildSeries(points));

    expect(upResult.interpretation[0].regimeAdjustedConfidence.value.greaterThan(downResult.interpretation[0].regimeAdjustedConfidence.value)).toBe(true);
  });

  it('populates real Traceability referencing RegimeContext/Indicator Engine only, never a SwingDetection computation', async () => {
    const points = [
      candle(0, { open: 110, high: 111, low: 104, close: 105 }),
      candle(1, { open: 105, high: 106, low: 104, close: 104.5 }),
      candle(2, { open: 104.5, high: 112.5, low: 104, close: 112 }),
      candle(3, { open: 112, high: 113, low: 111.5, close: 112.5 }),
    ];
    const { provider } = await buildProvider(2, points);

    const result = await provider.analyze(buildSeries(points));

    expect(result.traceability.intermediateCalculations).toHaveLength(2);
    for (const calculation of result.traceability.intermediateCalculations) {
      expect(calculation.computation).toBeTruthy();
      expect(calculation.computationVersion).toBeTruthy();
      expect(calculation.computation.toLowerCase()).not.toContain('swing');
    }
  });
});
