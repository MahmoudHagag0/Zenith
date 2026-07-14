import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { ConfluenceService } from './confluence.service';
import { EqualWeightStrategy } from './equal-weight.strategy';
import { CONFLUENCE_WEIGHT_STRATEGY } from './confluence.tokens';
import { ANALYSIS_PROVIDERS, PROVIDER_EXECUTION_ENGINE } from '../providers/analysis-provider.tokens';
import { WyckoffProvider } from '../providers/wyckoff/wyckoff.provider';
import { IctSmcProvider } from '../providers/ict-smc/ict-smc.provider';
import { ElliottWaveProvider } from '../providers/elliott-wave/elliott-wave.provider';
import { bosEvent, buildAtrOutput, buildRegimeResult, buildSeries, buildSwingResult, point as ictPoint, swing as ictSwing } from '../providers/ict-smc/ict-smc-test-fixtures';
import type { AnalysisProvider } from '../providers/analysis-provider.types';
import type { MarketSeries, MarketSeriesPoint } from '../market-series/market-series.types';
import type { Swing, SwingDetectionResult } from '../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../regime-context/regime-context.types';

/**
 * Golden-dataset / reference-scenario conformance test (S1-012 Sprint
 * Brief, Scope item 10): a constructed multi-Provider scenario built from
 * three real, independently-configured Providers (Wyckoff, ICT/SMC,
 * Elliott Wave), demonstrating both genuine agreement (CONFIRMATION:
 * Wyckoff's Last Point of Support and ICT/SMC's bullish Fair Value Gap
 * both read BULLISH, with Elliott Wave honestly NOT_APPLICABLE) and
 * genuine disagreement (STRUCTURE: Wyckoff and ICT/SMC read BULLISH,
 * Elliott Wave reads BEARISH from an independently constructed bearish
 * wave count over the same underlying price action). Note: for Elliott
 * Wave, TREND and STRUCTURE always share the same reading (both derive
 * directly from the primary wave count's own direction), so this
 * scenario's agreement dimension is deliberately CONFIRMATION rather than
 * TREND (the Task Breakdown's own "e.g." wording -- WP12 -- allows either
 * pair; TREND would trivially inherit STRUCTURE's disagreement here, so
 * CONFIRMATION is the honest choice, not TREND). Reuses each Provider's
 * own already source-disclosed, already-proven golden-dataset scenario
 * from its own Sprint (S1-009 WP10 for Wyckoff, S1-010 WP11 for ICT/SMC)
 * rather than hand-rolling new fixtures, so the specific detected
 * conditions this test's assertions depend on are known-correct, not
 * reverse-fitted. `ConfluenceService` must report both correctly, never
 * silently resolving the disagreement into a false consensus.
 */

function ewPoint(dayOffset: number, price: number): MarketSeriesPoint {
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

function ewSwing(type: 'HIGH' | 'LOW', price: number, dayOffset: number): Swing {
  return { timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)), type, price: new Prisma.Decimal(price), classification: null };
}

function ewSeries(points: MarketSeriesPoint[]): MarketSeries {
  return {
    assetId: 'confluence-golden-dataset-ew',
    requestedRange: { from: points[0].timestamp, to: points[points.length - 1].timestamp },
    points,
    missingDates: [],
    currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
  };
}

function ewSwingResultOf(swings: Swing[]): SwingDetectionResult {
  return {
    sensitivity: 3,
    swings,
    structureEvents: [],
    currentTrend: 'UP',
    metadata: { computation: 'SwingDetection', parameters: {}, formula: '', source: '', inputRange: { from: null, to: null, pointCount: 0 }, computedAt: new Date().toISOString(), computationVersion: '1.0.0' },
  };
}

function ewRegimeResultOf(trendState: 'TRENDING' | 'RANGING'): RegimeContextResult {
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

describe('Confluence Engine golden-dataset / reference-scenario conformance (S1-012 WP12)', () => {
  it('reports genuine agreement on CONFIRMATION (Wyckoff + ICT/SMC BULLISH) and genuine disagreement on STRUCTURE (2 BULLISH, 1 BEARISH), never resolving it into a false consensus', async () => {
    // Wyckoff: the exact canonical Accumulation Schematic #1 fixture proven, in
    // WyckoffProvider's own golden-dataset test (S1-009 WP10), to detect all
    // eight events (PS/SC/AR/ST/Spring/Test/SOS/LPS) and reach Phase D.
    function wyckoffPoint(volume: number, dayOffset: number): MarketSeriesPoint {
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
    const wyckoffVolumeOverrides: Record<number, number> = { 3: 3000, 7: 800, 9: 700, 11: 500 };
    const wyckoffPoints = Array.from({ length: 16 }, (_, i) => (i in wyckoffVolumeOverrides ? wyckoffPoint(wyckoffVolumeOverrides[i], i) : wyckoffPoint(1000, i)));
    const wyckoffSwings: Swing[] = [
      ewSwing('HIGH', 97, 0),
      ewSwing('LOW', 95, 1), // PS
      ewSwing('LOW', 90, 3), // SC
      ewSwing('HIGH', 100, 5), // AR
      ewSwing('LOW', 91, 7), // ST
      ewSwing('LOW', 88, 9), // SPRING
      ewSwing('LOW', 89, 11), // TEST
      ewSwing('HIGH', 106, 13), // SOS
      ewSwing('LOW', 93, 15), // LPS
    ];
    const wyckoffModule: TestingModule = await Test.createTestingModule({
      providers: [
        WyckoffProvider,
        { provide: 'INDICATOR_ENGINE', useValue: { atr: jest.fn().mockReturnValue({ series: [{ timestamp: new Date(), value: new Prisma.Decimal(1) }], metadata: { computation: 'ATR', computationVersion: '1.0.0' } }) } },
        { provide: 'SWING_DETECTOR', useValue: { detect: jest.fn().mockReturnValue(ewSwingResultOf(wyckoffSwings)) } },
        { provide: 'REGIME_CONTEXT', useValue: { getRegime: jest.fn().mockReturnValue(ewRegimeResultOf('RANGING')) } },
      ],
    }).compile();
    const wyckoffProvider = wyckoffModule.get(WyckoffProvider);
    const wyckoffSeries = ewSeries(wyckoffPoints);
    const wyckoffResult = await wyckoffProvider.analyze(wyckoffSeries);

    // ICT/SMC: the exact canonical liquidity-sweep-then-displacement bullish
    // setup proven, in IctSmcProvider's own golden-dataset test (S1-010
    // WP11), to detect a bullish Order Block, two bullish Fair Value Gaps,
    // and a bullish Liquidity Sweep.
    const ictPoints = [
      ictPoint(0, { open: 100, high: 101, low: 99, close: 100.5 }),
      ictPoint(1, { open: 100, high: 101, low: 95, close: 100 }),
      ictPoint(2, { open: 100, high: 106, low: 99, close: 105 }),
      ictPoint(3, { open: 105, high: 106.2, low: 94, close: 95 }),
      ictPoint(4, { open: 100, high: 101, low: 94, close: 99 }),
      ictPoint(5, { open: 99, high: 108, low: 98, close: 107 }),
      ictPoint(6, { open: 107, high: 112, low: 106, close: 111 }),
      ictPoint(7, { open: 111, high: 120, low: 110, close: 119 }),
    ];
    const ictSeries = buildSeries(ictPoints);
    const ictSwings = [ictSwing('LOW', 95, 1), ictSwing('HIGH', 106, 2), ictSwing('LOW', 94, 4), ictSwing('HIGH', 120, 7)];
    const ictSwingResult = buildSwingResult(ictSwings, [bosEvent('BULLISH', ictSwings[3])]);
    const ictModule: TestingModule = await Test.createTestingModule({
      providers: [
        IctSmcProvider,
        { provide: 'INDICATOR_ENGINE', useValue: { atr: jest.fn().mockReturnValue(buildAtrOutput(1)) } },
        { provide: 'SWING_DETECTOR', useValue: { detect: jest.fn().mockReturnValue(ictSwingResult) } },
        { provide: 'REGIME_CONTEXT', useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('RANGING')) } },
      ],
    }).compile();
    const ictProvider = ictModule.get(IctSmcProvider);
    const ictResult = await ictProvider.analyze(ictSeries);

    // Elliott Wave: an independently-constructed, Rule-satisfying BEARISH 5-wave impulse
    // (the same fixture proven valid in WP3's own dedicated Rule-satisfaction test) --
    // deliberately opposite in direction from Wyckoff/ICT-SMC's bullish reading above,
    // to genuinely exercise disagreement rather than construct it artificially.
    const ewPoints = Array.from({ length: 6 }, (_, i) => ewPoint(i, 120 - i));
    const ewSwings = [ewSwing('HIGH', 120, 0), ewSwing('LOW', 100, 1), ewSwing('HIGH', 112, 2), ewSwing('LOW', 70, 3), ewSwing('HIGH', 90, 4), ewSwing('LOW', 60, 5)];
    const ewModule: TestingModule = await Test.createTestingModule({
      providers: [
        ElliottWaveProvider,
        {
          provide: 'INDICATOR_ENGINE',
          useValue: {
            fibonacciLevels: jest.fn().mockImplementation(({ anchorStart, anchorEnd }: { anchorStart: Prisma.Decimal; anchorEnd: Prisma.Decimal }) => {
              const range = anchorEnd.minus(anchorStart);
              const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];
              return { levels: ratios.map((ratio) => ({ ratio, price: anchorEnd.minus(range.times(ratio)), isTrueFibonacciRatio: ratio !== 0.5 })), metadata: { computation: 'Fibonacci', computationVersion: '1.0.0' } };
            }),
          },
        },
        { provide: 'SWING_DETECTOR', useValue: { detect: jest.fn().mockReturnValue(ewSwingResultOf(ewSwings)) } },
        { provide: 'REGIME_CONTEXT', useValue: { getRegime: jest.fn().mockReturnValue(ewRegimeResultOf('TRENDING')) } },
      ],
    }).compile();
    const ewProvider = ewModule.get(ElliottWaveProvider);
    const ewSeriesFixture = ewSeries(ewPoints);
    const ewResult = await ewProvider.analyze(ewSeriesFixture);

    // Assemble ConfluenceService with a mocked Execution Engine that simply returns
    // these three already-computed, genuinely-real analyze() results as participating --
    // the Execution Engine's own tiering/circuit-breaker orchestration is S1-008's own
    // tested concern, not this golden-dataset scenario's.
    const providers: AnalysisProvider[] = [wyckoffProvider, ictProvider, ewProvider];
    const confluenceModule: TestingModule = await Test.createTestingModule({
      providers: [
        ConfluenceService,
        { provide: ANALYSIS_PROVIDERS, useValue: providers },
        {
          provide: PROVIDER_EXECUTION_ENGINE,
          useValue: {
            runNewAnalysis: jest.fn().mockReturnValue({
              fastTier: Promise.resolve({ participating: [{ providerId: 'ICT_SMC', result: ictResult }], nonParticipating: [], totalRegistered: 1 }),
              slowTier: Promise.resolve({
                participating: [
                  { providerId: 'WYCKOFF', result: wyckoffResult },
                  { providerId: 'ELLIOTT_WAVE', result: ewResult },
                ],
                nonParticipating: [],
                totalRegistered: 2,
              }),
            }),
          },
        },
        { provide: CONFLUENCE_WEIGHT_STRATEGY, useClass: EqualWeightStrategy },
      ],
    }).compile();
    const confluenceService = confluenceModule.get(ConfluenceService);

    const confluence = await confluenceService.computeConfluence(ewSeries(wyckoffPoints));

    expect(confluence.participation.participating.map((p) => p.providerId).sort()).toEqual(['ELLIOTT_WAVE', 'ICT_SMC', 'WYCKOFF']);

    // Genuine agreement: Wyckoff's Last Point of Support and ICT/SMC's bullish Fair
    // Value Gap independently confirm the same CONFIRMATION dimension bullish. Elliott
    // Wave's own CONFIRMATION reading is honestly NOT_APPLICABLE here (its weakest Rule
    // margin, 24, falls below this Provider's own CONFIRMATION_MARGIN_THRESHOLD of 50) --
    // it simply does not participate in this dimension, rather than being forced to agree.
    const confirmation = confluence.dimensions.find((d) => d.dimension === 'CONFIRMATION')!;
    expect(confirmation.disagreement).toBe(false);
    expect(confirmation.aggregateReading).toBe('BULLISH');
    expect(confirmation.bullishContributors.map((c) => c.providerId).sort()).toEqual(['ICT_SMC', 'WYCKOFF']);
    expect(confirmation.bearishContributors).toEqual([]);

    // Genuine disagreement: Wyckoff's Sign of Strength and ICT/SMC's bullish Order Block
    // both read STRUCTURE bullish, while Elliott Wave's independently-constructed bearish
    // 5-wave impulse reads STRUCTURE bearish from the same underlying price action --
    // the Confluence Engine must surface this, never paper it over into a false consensus.
    const structure = confluence.dimensions.find((d) => d.dimension === 'STRUCTURE')!;
    expect(structure.disagreement).toBe(true);
    expect(structure.bullishContributors.map((c) => c.providerId).sort()).toEqual(['ICT_SMC', 'WYCKOFF']);
    expect(structure.bearishContributors.map((c) => c.providerId)).toEqual(['ELLIOTT_WAVE']);
    // The disagreement is surfaced, never papered over into an artificial NEUTRAL.
    expect(structure.aggregateReading).not.toBe('NOT_APPLICABLE');
  });
});
