import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { WyckoffProvider } from './wyckoff/wyckoff.provider';
import { IctSmcProvider } from './ict-smc/ict-smc.provider';
import { ElliottWaveProvider } from './elliott-wave/elliott-wave.provider';
import { HarmonicPatternsProvider } from './harmonic-patterns/harmonic-patterns.provider';
import { ClassicalChartPatternsProvider } from './classical-chart-patterns/classical-chart-patterns.provider';
import { PriceActionProvider } from './price-action/price-action.provider';
import { SupplyDemandProvider } from './supply-demand/supply-demand.provider';
import { INDICATOR_ENGINE } from '../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../regime-context/regime-context.tokens';
import type { AnalysisProvider } from './analysis-provider.types';
import type { MarketSeries, MarketSeriesPoint } from '../market-series/market-series.types';
import type { Swing, StructureEvent, SwingDetectionResult } from '../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../regime-context/regime-context.types';
import type { NormalizedDimension } from './normalized-vocabulary.types';

const ALL_NORMALIZED_DIMENSIONS: readonly NormalizedDimension[] = ['TREND', 'MOMENTUM', 'LIQUIDITY', 'STRUCTURE', 'VOLATILITY', 'VOLUME', 'CONFIRMATION'];

/**
 * The shared `normalize()` conformance test suite (S1-012 Sprint Brief,
 * Scope item 4; ADR-007: "a shared conformance test suite... maintained
 * centrally... to prevent semantic drift"). Runs the same generic
 * assertions against every registered Provider's real `normalize()`
 * output -- adding a fourth Provider means adding one entry to
 * `PROVIDER_FIXTURES` below, not writing a new conformance test from
 * scratch.
 */

function point(dayOffset: number, price: number): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(price),
    high: new Prisma.Decimal(price),
    low: new Prisma.Decimal(price),
    close: new Prisma.Decimal(price),
    volume: new Prisma.Decimal(1000),
    dataQuality: { kind: 'historical', completeness: 'PRESENT' },
  };
}

function swing(type: 'HIGH' | 'LOW', price: number, dayOffset: number): Swing {
  return { timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)), type, price: new Prisma.Decimal(price), classification: null };
}

function series(points: MarketSeriesPoint[]): MarketSeries {
  return {
    assetId: 'conformance-fixture',
    requestedRange: { from: points[0].timestamp, to: points[points.length - 1].timestamp },
    points,
    missingDates: [],
    currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
  };
}

function swingResultOf(swings: Swing[], structureEvents: StructureEvent[] = []): SwingDetectionResult {
  return {
    sensitivity: 3,
    swings,
    structureEvents,
    currentTrend: 'UP',
    metadata: { computation: 'SwingDetection', parameters: {}, formula: '', source: '', inputRange: { from: null, to: null, pointCount: 0 }, computedAt: new Date().toISOString(), computationVersion: '1.0.0' },
  };
}

function regimeResultOf(trendState: 'TRENDING' | 'RANGING'): RegimeContextResult {
  return {
    trendState,
    trendDirection: 'UP',
    volatilityState: 'LOW',
    adx: new Prisma.Decimal(20),
    atr: new Prisma.Decimal(1),
    atrBaseline: new Prisma.Decimal(1),
    metadata: { computation: 'RegimeContext', parameters: {}, formula: '', source: '', inputRange: { from: null, to: null, pointCount: 0 }, computedAt: new Date().toISOString(), computationVersion: '1.0.0' },
  };
}

async function buildWyckoffProvider(): Promise<{ provider: AnalysisProvider; series: MarketSeries }> {
  const overrides: Record<number, number> = { 3: 3000, 7: 800, 9: 700, 11: 500 };
  const points = Array.from({ length: 16 }, (_, i) => point(i, 1000 + (i in overrides ? overrides[i] - 1000 : 0)));
  const swings = [
    swing('HIGH', 97, 0),
    swing('LOW', 95, 1),
    swing('LOW', 90, 3),
    swing('HIGH', 100, 5),
    swing('LOW', 91, 7),
    swing('LOW', 88, 9),
    swing('LOW', 89, 11),
    swing('HIGH', 106, 13),
    swing('LOW', 93, 15),
  ];
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      WyckoffProvider,
      { provide: INDICATOR_ENGINE, useValue: { atr: jest.fn().mockReturnValue({ series: [{ timestamp: new Date(), value: new Prisma.Decimal(1) }], metadata: { computation: 'ATR', computationVersion: '1.0.0' } }) } },
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(swingResultOf(swings)) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(regimeResultOf('RANGING')) } },
    ],
  }).compile();
  return { provider: module.get(WyckoffProvider), series: series(points) };
}

async function buildIctSmcProvider(): Promise<{ provider: AnalysisProvider; series: MarketSeries }> {
  const candlePoints = [
    point(0, 100),
    point(1, 100),
    point(2, 100),
    point(3, 100),
    point(4, 100),
  ].map((p, i) => ({ ...p, high: new Prisma.Decimal(101 + i), low: new Prisma.Decimal(99 - i), close: new Prisma.Decimal(100 + i * 5) }));
  const swings = [swing('LOW', 99, 1), swing('HIGH', 114, 4)];
  const bos: StructureEvent = { timestamp: swings[1].timestamp, type: 'BOS', direction: 'BULLISH', trendBefore: 'UP', trendAfter: 'UP', swing: swings[1] };
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      IctSmcProvider,
      { provide: INDICATOR_ENGINE, useValue: { fibonacciLevels: jest.fn().mockReturnValue({ levels: [], metadata: { computation: 'Fibonacci', computationVersion: '1.0.0' } }), atr: jest.fn().mockReturnValue({ series: [{ timestamp: new Date(), value: new Prisma.Decimal(5) }], metadata: { computation: 'ATR', computationVersion: '1.0.0' } }) } },
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(swingResultOf(swings, [bos])) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(regimeResultOf('TRENDING')) } },
    ],
  }).compile();
  return { provider: module.get(IctSmcProvider), series: series(candlePoints) };
}

async function buildElliottWaveProvider(): Promise<{ provider: AnalysisProvider; series: MarketSeries }> {
  const points = Array.from({ length: 6 }, (_, i) => point(i, 100 + i));
  const swings = [swing('LOW', 100, 0), swing('HIGH', 120, 1), swing('LOW', 108, 2), swing('HIGH', 150, 3), swing('LOW', 130, 4), swing('HIGH', 160, 5)];
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ElliottWaveProvider,
      { provide: INDICATOR_ENGINE, useValue: { fibonacciLevels: jest.fn().mockImplementation(({ anchorStart, anchorEnd }: { anchorStart: Prisma.Decimal; anchorEnd: Prisma.Decimal }) => {
        const range = anchorEnd.minus(anchorStart);
        const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];
        return { levels: ratios.map((ratio) => ({ ratio, price: anchorEnd.minus(range.times(ratio)), isTrueFibonacciRatio: ratio !== 0.5 })), metadata: { computation: 'Fibonacci', computationVersion: '1.0.0' } };
      }) } },
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(swingResultOf(swings)) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(regimeResultOf('TRENDING')) } },
    ],
  }).compile();
  return { provider: module.get(ElliottWaveProvider), series: series(points) };
}

async function buildHarmonicPatternsProvider(): Promise<{ provider: AnalysisProvider; series: MarketSeries }> {
  const points = Array.from({ length: 5 }, (_, i) => point(i, 50 + i));
  // A textbook-clean bullish Gartley: XA=100 (0->100), AB=0.618*XA (B=38.2), BC=0.618*AB (C=76.4), AD=0.786*XA (D=21.4).
  const swings = [swing('LOW', 0, 0), swing('HIGH', 100, 1), swing('LOW', 38.2, 2), swing('HIGH', 76.4, 3), swing('LOW', 21.4, 4)];
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      HarmonicPatternsProvider,
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(swingResultOf(swings)) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(regimeResultOf('RANGING')) } },
    ],
  }).compile();
  return { provider: module.get(HarmonicPatternsProvider), series: series(points) };
}

async function buildClassicalChartPatternsProvider(): Promise<{ provider: AnalysisProvider; series: MarketSeries }> {
  const points = Array.from({ length: 5 }, (_, i) => point(i, 100 + i));
  // A textbook-clean bearish Head and Shoulders: LeftShoulder(100) < Head(110) > RightShoulder(101), neckline troughs at 90/91.
  const swings = [swing('HIGH', 100, 0), swing('LOW', 90, 1), swing('HIGH', 110, 2), swing('LOW', 91, 3), swing('HIGH', 101, 4)];
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ClassicalChartPatternsProvider,
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(swingResultOf(swings)) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(regimeResultOf('RANGING')) } },
    ],
  }).compile();
  return { provider: module.get(ClassicalChartPatternsProvider), series: series(points) };
}

async function buildPriceActionProvider(): Promise<{ provider: AnalysisProvider; series: MarketSeries }> {
  const points = [point(0, 100), { ...point(1, 108), high: new Prisma.Decimal(109), low: new Prisma.Decimal(99) }];
  const swings = [swing('HIGH', 100, 0)];
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      PriceActionProvider,
      { provide: INDICATOR_ENGINE, useValue: { atr: jest.fn().mockReturnValue({ series: points.map((p) => ({ timestamp: p.timestamp, value: new Prisma.Decimal(1) })), metadata: { computation: 'ATR', computationVersion: '1.0.0' } }) } },
      { provide: SWING_DETECTOR, useValue: { detect: jest.fn().mockReturnValue(swingResultOf(swings)) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(regimeResultOf('TRENDING')) } },
    ],
  }).compile();
  return { provider: module.get(PriceActionProvider), series: series(points) };
}

async function buildSupplyDemandProvider(): Promise<{ provider: AnalysisProvider; series: MarketSeries }> {
  const points = [
    { ...point(0, 110), high: new Prisma.Decimal(111), low: new Prisma.Decimal(104), close: new Prisma.Decimal(105) },
    { ...point(1, 105), high: new Prisma.Decimal(106), low: new Prisma.Decimal(104), close: new Prisma.Decimal(104.5) },
    { ...point(2, 104.5), high: new Prisma.Decimal(112.5), low: new Prisma.Decimal(104), close: new Prisma.Decimal(112) },
    { ...point(3, 112), high: new Prisma.Decimal(113), low: new Prisma.Decimal(111.5), close: new Prisma.Decimal(112.5) },
  ];
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      SupplyDemandProvider,
      { provide: INDICATOR_ENGINE, useValue: { atr: jest.fn().mockReturnValue({ series: points.map((p) => ({ timestamp: p.timestamp, value: new Prisma.Decimal(2) })), metadata: { computation: 'ATR', computationVersion: '1.0.0' } }) } },
      { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(regimeResultOf('TRENDING')) } },
    ],
  }).compile();
  return { provider: module.get(SupplyDemandProvider), series: series(points) };
}

const PROVIDER_FIXTURES: Array<{ name: string; build: () => Promise<{ provider: AnalysisProvider; series: MarketSeries }> }> = [
  { name: 'WyckoffProvider', build: buildWyckoffProvider },
  { name: 'IctSmcProvider', build: buildIctSmcProvider },
  { name: 'ElliottWaveProvider', build: buildElliottWaveProvider },
  { name: 'HarmonicPatternsProvider', build: buildHarmonicPatternsProvider },
  { name: 'ClassicalChartPatternsProvider', build: buildClassicalChartPatternsProvider },
  { name: 'PriceActionProvider', build: buildPriceActionProvider },
  { name: 'SupplyDemandProvider', build: buildSupplyDemandProvider },
];

describe.each(PROVIDER_FIXTURES)('normalize() conformance — $name (S1-012 WP6)', ({ build }) => {
  it('returns exactly seven signals, one per ratified dimension, each with a valid reading, a strength in [0,100], and a non-empty explanation whenever applicable', async () => {
    const { provider, series: fixtureSeries } = await build();
    const result = await provider.analyze(fixtureSeries);
    const normalized = provider.normalize(result);

    expect(normalized.providerId).toBe(provider.id);
    expect(normalized.vocabularySchemaVersion).toBeTruthy();
    expect(normalized.signals).toHaveLength(7);
    expect(new Set(normalized.signals.map((s) => s.dimension))).toEqual(new Set(ALL_NORMALIZED_DIMENSIONS));

    for (const signal of normalized.signals) {
      expect(['BULLISH', 'BEARISH', 'NEUTRAL', 'NOT_APPLICABLE']).toContain(signal.reading);
      expect(signal.strength).toBeGreaterThanOrEqual(0);
      expect(signal.strength).toBeLessThanOrEqual(100);
      if (signal.reading !== 'NOT_APPLICABLE') {
        expect(signal.explanation.length).toBeGreaterThan(0);
      }
    }
  });
});
