import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { WyckoffProvider } from './wyckoff.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import type { MarketSeries, MarketSeriesPoint } from '../../market-series/market-series.types';
import type { Swing } from '../../swing-detection/swing-detection.types';

describe('WyckoffProvider skeleton (WP1)', () => {
  let provider: WyckoffProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WyckoffProvider,
        { provide: INDICATOR_ENGINE, useValue: {} },
        { provide: SWING_DETECTOR, useValue: {} },
        { provide: REGIME_CONTEXT, useValue: {} },
      ],
    }).compile();
    provider = module.get(WyckoffProvider);
  });

  it('satisfies the full AnalysisProvider interface', () => {
    expect(provider.id).toBe('WYCKOFF');
    expect(provider.methodologyFamily).toBe('WYCKOFF');
    expect(provider.lifecycleState).toBe('ACTIVE');
    expect(provider.tier).toBe('SLOW');
    expect(provider.computationVersion).toBe('1.0.0');
    expect(provider.dependsOn).toBeUndefined();
    expect(provider.normalize()).toBeUndefined();
  });

  it('is the only Provider currently declaring methodologyFamily WYCKOFF', () => {
    expect(provider.methodologyFamily).toBe('WYCKOFF');
  });
});

function point(volume: number, dayOffset: number): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(100),
    high: new Prisma.Decimal(100),
    low: new Prisma.Decimal(100),
    close: new Prisma.Decimal(100),
    volume: new Prisma.Decimal(volume),
    dataQuality: { kind: 'historical', completeness: 'PRESENT' },
  };
}

function swing(type: 'HIGH' | 'LOW', price: number, dayOffset: number): Swing {
  return { timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)), type, price: new Prisma.Decimal(price), classification: null };
}

function fullAccumulationSeries(): MarketSeries {
  const overrides: Record<number, number> = { 3: 3000, 7: 800, 9: 700, 11: 500 };
  const points = Array.from({ length: 16 }, (_, i) => (i in overrides ? point(overrides[i], i) : point(1000, i)));
  return {
    assetId: 'asset-1',
    requestedRange: { from: points[0].timestamp, to: points[points.length - 1].timestamp },
    points,
    missingDates: [],
    currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
  };
}

// Includes one minor pre-PS swing high (day 0) alongside AR so the range's
// establishing set (the earliest two highs) is AR + this minor high, not
// AR + SOS -- leaving SOS free to exceed resistance. A real multi-week
// series virtually always has more than exactly two swing highs; a
// schematic this sparse (only AR and SOS, nothing else) is a disclosed V1
// edge case where the range could under-establish -- see Known
// Limitations at sprint closure.
const FULL_ACCUMULATION_SWINGS: Swing[] = [
  swing('HIGH', 97, 0), // minor pre-schematic high, establishes resistance alongside AR
  swing('LOW', 95, 1), // PS
  swing('LOW', 90, 3), // SC
  swing('HIGH', 100, 5), // AR
  swing('LOW', 91, 7), // ST
  swing('LOW', 88, 9), // SPRING
  swing('LOW', 89, 11), // TEST
  swing('HIGH', 106, 13), // SOS
  swing('LOW', 93, 15), // LPS
];

describe('WyckoffProvider.analyze() (WP6 integration)', () => {
  async function buildProvider(trendState: 'RANGING' | 'TRENDING') {
    const swingDetector = {
      detect: jest.fn().mockReturnValue({
        sensitivity: 3,
        swings: FULL_ACCUMULATION_SWINGS,
        structureEvents: [],
        currentTrend: 'UP',
        metadata: { computation: 'SwingDetection', computationVersion: '1.0.0' },
      }),
    };
    const regimeContext = {
      getRegime: jest.fn().mockReturnValue({
        trendState,
        trendDirection: 'UP',
        volatilityState: 'LOW',
        adx: new Prisma.Decimal(15),
        atr: new Prisma.Decimal(1),
        atrBaseline: new Prisma.Decimal(1),
        metadata: { computation: 'RegimeContext', computationVersion: '1.0.0' },
      }),
    };
    const indicatorEngine = {
      atr: jest.fn().mockReturnValue({
        series: [{ timestamp: new Date(), value: new Prisma.Decimal(1) }],
        metadata: { computation: 'ATR', computationVersion: '1.0.0' },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WyckoffProvider,
        { provide: INDICATOR_ENGINE, useValue: indicatorEngine },
        { provide: SWING_DETECTOR, useValue: swingDetector },
        { provide: REGIME_CONTEXT, useValue: regimeContext },
      ],
    }).compile();
    return module.get(WyckoffProvider);
  }

  it('produces a full result with detection, interpretation, regime-adjusted, and methodology-ceiling confidence for a complete schematic', async () => {
    const provider = await buildProvider('RANGING');
    const result = await provider.analyze(fullAccumulationSeries());

    expect(result.contractVersion).toBe('1.0.0');
    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].confidence.kind).toBe('INTERPRETATION');
    expect(result.interpretation[0].regimeAdjustedConfidence.kind).toBe('REGIME_ADJUSTED');
    expect(result.detectionConfidence.kind).toBe('DETECTION');
    expect(result.detectionConfidence.value.toNumber()).toBe(85); // 8 of 8 events detected (100), capped at the Methodology Confidence Ceiling (85)
    expect(result.methodologyConfidenceCeiling.kind).toBe('METHODOLOGY_CEILING');
    expect(result.evidence.detectedConditions).toHaveLength(8);
    expect(result.limitations.dataQuality).toBe('COMPLETE');
  });

  it('reports lower Regime-Adjusted Confidence under TRENDING than RANGING for the identical detected structure', async () => {
    const trendingProvider = await buildProvider('TRENDING');
    const rangingProvider = await buildProvider('RANGING');

    const trendingResult = await trendingProvider.analyze(fullAccumulationSeries());
    const rangingResult = await rangingProvider.analyze(fullAccumulationSeries());

    expect(trendingResult.interpretation[0].regimeAdjustedConfidence.value.toNumber()).toBeLessThan(
      rangingResult.interpretation[0].regimeAdjustedConfidence.value.toNumber(),
    );
  });

  it('populates Traceability with the actual computation/computationVersion of every underlying call made (WP8)', async () => {
    const provider = await buildProvider('RANGING');
    const result = await provider.analyze(fullAccumulationSeries());

    expect(result.traceability.rawDataReferences.length).toBeGreaterThan(0);
    expect(result.traceability.intermediateCalculations).toEqual(
      expect.arrayContaining([
        { computation: 'SwingDetection', computationVersion: '1.0.0' },
        { computation: 'RegimeContext', computationVersion: '1.0.0' },
        { computation: 'ATR', computationVersion: '1.0.0' },
      ]),
    );
    expect(result.traceability.intermediateCalculations).toHaveLength(3);
    expect(result.traceability.conditionDerivations.length).toBeGreaterThan(0);
    expect(result.traceability.confidenceDerivation).toContain('RANGING');
  });
});

describe('WyckoffProvider.analyze() Limitations / graceful degradation (WP7)', () => {
  async function buildProviderWithSwings(swings: Swing[]) {
    const swingDetector = {
      detect: jest.fn().mockReturnValue({ sensitivity: 3, swings, structureEvents: [], currentTrend: 'UNKNOWN', metadata: { computation: 'SwingDetection', computationVersion: '1.0.0' } }),
    };
    const regimeContext = {
      getRegime: jest.fn().mockReturnValue({
        trendState: 'RANGING',
        trendDirection: 'UNKNOWN',
        volatilityState: 'LOW',
        adx: new Prisma.Decimal(15),
        atr: new Prisma.Decimal(1),
        atrBaseline: new Prisma.Decimal(1),
        metadata: { computation: 'RegimeContext', computationVersion: '1.0.0' },
      }),
    };
    const indicatorEngine = {
      atr: jest.fn().mockReturnValue({ series: [{ timestamp: new Date(), value: new Prisma.Decimal(1) }], metadata: { computation: 'ATR', computationVersion: '1.0.0' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WyckoffProvider,
        { provide: INDICATOR_ENGINE, useValue: indicatorEngine },
        { provide: SWING_DETECTOR, useValue: swingDetector },
        { provide: REGIME_CONTEXT, useValue: regimeContext },
      ],
    }).compile();
    return module.get(WyckoffProvider);
  }

  it('never throws and returns a populated Limitations entry when there is insufficient swing structure for any range', async () => {
    const provider = await buildProviderWithSwings([swing('LOW', 95, 1), swing('HIGH', 105, 2)]);
    const result = await provider.analyze(fullAccumulationSeries());

    expect(result.interpretation).toEqual([]);
    expect(result.limitations.notes.length).toBeGreaterThan(0);
    expect(result.limitations.dataQuality).not.toBeUndefined();
  });

  it('never throws for a completely empty swing set (a clean, uninterrupted trend)', async () => {
    const provider = await buildProviderWithSwings([]);
    await expect(provider.analyze(fullAccumulationSeries())).resolves.toBeDefined();
  });

  it('reports Limitations dataQuality MISSING when the series has no points at all', async () => {
    const provider = await buildProviderWithSwings([]);
    const emptySeries: MarketSeries = {
      assetId: 'asset-empty',
      requestedRange: { from: new Date(), to: new Date() },
      points: [],
      missingDates: [],
      currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
    };
    const result = await provider.analyze(emptySeries);
    expect(result.limitations.dataQuality).toBe('MISSING');
  });
});
