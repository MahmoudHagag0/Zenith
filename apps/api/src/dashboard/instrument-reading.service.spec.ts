import { Prisma } from '@zenith/database';
import { InstrumentReadingService } from './instrument-reading.service';
import type { ConfluenceEngine } from '../analysis-engine/confluence/confluence.tokens';
import type { ConfluenceResultWithEvidence } from '../analysis-engine/confluence/confluence.types';
import type { AnalysisProviderResult } from '../analysis-engine/providers/analysis-provider.types';
import type { MarketSeries } from '../analysis-engine/market-series/market-series.types';

const ALL_DIMENSIONS = ['TREND', 'MOMENTUM', 'LIQUIDITY', 'STRUCTURE', 'VOLATILITY', 'VOLUME', 'CONFIRMATION'] as const;

function emptySeries(): MarketSeries {
  return {
    assetId: 'asset-1',
    requestedRange: { from: new Date(), to: new Date() },
    points: [],
    missingDates: [],
    currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
  };
}

function fixtureResult(detectionConfidence: number, interpretationConfidence: number, interpretationCount = 1): AnalysisProviderResult {
  return {
    contractVersion: '1.0.0',
    evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
    interpretation: Array.from({ length: interpretationCount }, (_, i) => ({
      summary: `interpretation-${i}`,
      confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(interpretationConfidence - i), explanation: 'x' },
      regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(interpretationConfidence - i), explanation: 'x' },
    })),
    limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(detectionConfidence), explanation: 'x' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(80), explanation: 'x' },
  };
}

function confluenceResult(providerIds: string[]): ConfluenceResultWithEvidence {
  return {
    confluence: {
      dimensions: ALL_DIMENSIONS.map((dimension) => ({ dimension, aggregateReading: 'NOT_APPLICABLE', disagreement: false, bullishContributors: [], bearishContributors: [] })),
      participation: {
        participating: providerIds.map((providerId) => ({ providerId })),
        nonParticipating: [],
      },
    },
    providerResults: providerIds.map((providerId, i) => ({ providerId, methodologyFamily: `FAMILY-${i}`, result: fixtureResult(50 + i, 60) })),
  };
}

function buildService(confluenceEngine: Partial<ConfluenceEngine>, getSeries = jest.fn().mockResolvedValue(emptySeries())) {
  const marketSeriesService = { getSeries } as unknown as { getSeries: typeof getSeries };
  const service = new InstrumentReadingService(marketSeriesService as never, confluenceEngine as ConfluenceEngine);
  return { service, getSeries };
}

describe('InstrumentReadingService (S1-019 WP2)', () => {
  it('synthesizes an InstrumentReading with dimensions, participation, and bounded top contributors sorted by detectionConfidence', async () => {
    const computeConfluenceWithEvidence = jest.fn().mockResolvedValue(confluenceResult(['A', 'B', 'C', 'D', 'E', 'F']));
    const { service } = buildService({ computeConfluenceWithEvidence });

    const reading = await service.getInstrumentReading('asset-1');

    expect(reading.dimensions).toHaveLength(7);
    expect(reading.participation.participatingCount).toBe(6);
    expect(reading.topContributors).toHaveLength(5); // MAX_TOP_CONTRIBUTORS bound
    expect(reading.topContributors[0].providerId).toBe('F'); // highest detectionConfidence (50+5)
    expect(reading.topContributors.map((c) => c.detectionConfidence.value.toNumber())).toEqual([55, 54, 53, 52, 51]);
  });

  it('never assumes interpretation[0] is highest confidence -- picks by INTERPRETATION-kind confidence value', async () => {
    // fixtureResult builds interpretation entries in *descending* confidence order by construction,
    // so exercise a case where the highest-confidence entry is deliberately NOT first.
    const reversed: AnalysisProviderResult = {
      ...fixtureResult(50, 10),
      interpretation: [
        { summary: 'low', confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(10), explanation: '' }, regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(10), explanation: '' } },
        { summary: 'high', confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(90), explanation: '' }, regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(90), explanation: '' } },
      ],
    };
    const computeConfluenceWithEvidence = jest.fn().mockResolvedValue({
      confluence: confluenceResult(['A']).confluence,
      providerResults: [{ providerId: 'A', methodologyFamily: 'X', result: reversed }],
    });
    const { service } = buildService({ computeConfluenceWithEvidence });

    const reading = await service.getInstrumentReading('asset-1');
    expect(reading.topContributors[0].interpretationSummary).toBe('high');
  });

  it('excludes a Provider with zero interpretation entries from topContributors without crashing', async () => {
    const noInterpretation: AnalysisProviderResult = { ...fixtureResult(90, 0), interpretation: [] };
    const computeConfluenceWithEvidence = jest.fn().mockResolvedValue({
      confluence: confluenceResult(['A']).confluence,
      providerResults: [{ providerId: 'A', methodologyFamily: undefined, result: noInterpretation }],
    });
    const { service } = buildService({ computeConfluenceWithEvidence });

    const reading = await service.getInstrumentReading('asset-1');
    expect(reading.topContributors).toEqual([]);
  });

  it('reuses a cached reading within the TTL window, never re-invoking the Confluence Engine', async () => {
    const computeConfluenceWithEvidence = jest.fn().mockResolvedValue(confluenceResult(['A']));
    const { service, getSeries } = buildService({ computeConfluenceWithEvidence });

    await service.getInstrumentReading('asset-1');
    await service.getInstrumentReading('asset-1');

    expect(computeConfluenceWithEvidence).toHaveBeenCalledTimes(1);
    expect(getSeries).toHaveBeenCalledTimes(1);
  });

  it('caches independently per assetId', async () => {
    const computeConfluenceWithEvidence = jest.fn().mockResolvedValue(confluenceResult(['A']));
    const { service } = buildService({ computeConfluenceWithEvidence });

    await service.getInstrumentReading('asset-1');
    await service.getInstrumentReading('asset-2');

    expect(computeConfluenceWithEvidence).toHaveBeenCalledTimes(2);
  });

  it('never fabricates agreement for a non-participating Provider and handles zero participation without crashing', async () => {
    const computeConfluenceWithEvidence = jest.fn().mockResolvedValue({
      confluence: {
        dimensions: ALL_DIMENSIONS.map((dimension) => ({ dimension, aggregateReading: 'NOT_APPLICABLE', disagreement: false, bullishContributors: [], bearishContributors: [] })),
        participation: { participating: [], nonParticipating: [{ providerId: 'X', reason: 'TIMEOUT', detail: 'slow' }] },
      },
      providerResults: [],
    });
    const { service } = buildService({ computeConfluenceWithEvidence });

    const reading = await service.getInstrumentReading('asset-1');
    expect(reading.topContributors).toEqual([]);
    expect(reading.participation.participatingCount).toBe(0);
    expect(reading.participation.nonParticipating).toEqual([{ providerId: 'X', reason: 'TIMEOUT', detail: 'slow' }]);
  });
});
