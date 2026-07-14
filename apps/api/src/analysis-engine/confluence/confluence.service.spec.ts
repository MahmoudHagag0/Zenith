import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { ConfluenceService } from './confluence.service';
import { EqualWeightStrategy } from './equal-weight.strategy';
import { CONFLUENCE_WEIGHT_STRATEGY } from './confluence.tokens';
import { ANALYSIS_PROVIDERS, PROVIDER_EXECUTION_ENGINE } from '../providers/analysis-provider.tokens';
import type { AnalysisProvider, AnalysisProviderResult } from '../providers/analysis-provider.types';
import type { NormalizedProviderOutput } from '../providers/normalized-vocabulary.types';
import type { MarketSeries } from '../market-series/market-series.types';

const ALL_NOT_APPLICABLE_DIMENSIONS = ['TREND', 'MOMENTUM', 'LIQUIDITY', 'STRUCTURE', 'VOLATILITY', 'VOLUME', 'CONFIRMATION'] as const;

function stubResult(): AnalysisProviderResult {
  return {
    contractVersion: '1.0.0',
    evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
    interpretation: [],
    limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: ['secret internal trace detail'], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(50), explanation: '' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(80), explanation: '' },
  };
}

function fixtureProvider(id: string, methodologyFamily: string | undefined, dimensionOverrides: Partial<Record<(typeof ALL_NOT_APPLICABLE_DIMENSIONS)[number], { reading: 'BULLISH' | 'BEARISH'; strength: number }>>): AnalysisProvider {
  return {
    id,
    methodologyFamily,
    computationVersion: '1.0.0',
    lifecycleState: 'ACTIVE',
    tier: 'FAST',
    dependsOn: undefined,
    analyze: async () => stubResult(),
    normalize: (): NormalizedProviderOutput => ({
      providerId: id,
      methodologyFamily,
      vocabularySchemaVersion: '1.0.0',
      signals: ALL_NOT_APPLICABLE_DIMENSIONS.map((dimension) => {
        const override = dimensionOverrides[dimension];
        return override
          ? { dimension, reading: override.reading, strength: override.strength, explanation: 'fixture' }
          : { dimension, reading: 'NOT_APPLICABLE' as const, strength: 0, explanation: '' };
      }),
    }),
  };
}

async function buildService(providers: AnalysisProvider[], runNewAnalysis: jest.Mock) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ConfluenceService,
      { provide: ANALYSIS_PROVIDERS, useValue: providers },
      { provide: PROVIDER_EXECUTION_ENGINE, useValue: { runNewAnalysis, runProviderDirectly: jest.fn() } },
      { provide: CONFLUENCE_WEIGHT_STRATEGY, useClass: EqualWeightStrategy },
    ],
  }).compile();
  return module.get(ConfluenceService);
}

function series(): MarketSeries {
  return {
    assetId: 'asset-1',
    requestedRange: { from: new Date(), to: new Date() },
    points: [],
    missingDates: [],
    currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
  };
}

describe('ConfluenceService (S1-012 WP10-WP11)', () => {
  it('reports Provider participation explicitly, matching the Execution Engine result across both tiers, never inferred', async () => {
    const providerA = fixtureProvider('A', undefined, {});
    const providerB = fixtureProvider('B', undefined, {});
    const runNewAnalysis = jest.fn().mockReturnValue({
      fastTier: Promise.resolve({ participating: [{ providerId: 'A', result: stubResult() }], nonParticipating: [], totalRegistered: 1 }),
      slowTier: Promise.resolve({ participating: [], nonParticipating: [{ providerId: 'B', reason: 'CIRCUIT_OPEN', detail: 'open circuit' }], totalRegistered: 1 }),
    });
    const service = await buildService([providerA, providerB], runNewAnalysis);

    const result = await service.computeConfluence(series());

    expect(result.participation.participating).toEqual([{ providerId: 'A', methodologyFamily: undefined }]);
    expect(result.participation.nonParticipating).toEqual([{ providerId: 'B', reason: 'CIRCUIT_OPEN', detail: 'open circuit' }]);
  });

  it('per-Provider references carry only providerId/methodologyFamily -- never embedded traceability/evidence/interpretation', async () => {
    const providerA = fixtureProvider('A', 'WYCKOFF', {});
    const runNewAnalysis = jest.fn().mockReturnValue({
      fastTier: Promise.resolve({ participating: [{ providerId: 'A', result: stubResult() }], nonParticipating: [], totalRegistered: 1 }),
      slowTier: Promise.resolve({ participating: [], nonParticipating: [], totalRegistered: 0 }),
    });
    const service = await buildService([providerA], runNewAnalysis);

    const result = await service.computeConfluence(series());

    const reference = result.participation.participating[0];
    expect(Object.keys(reference).sort()).toEqual(['methodologyFamily', 'providerId']);
    expect(JSON.stringify(result)).not.toContain('secret internal trace detail');
  });

  it('assembles all seven dimensions from real Provider normalize() output, correctly detecting disagreement across two independently-registered Providers', async () => {
    const providerA = fixtureProvider('A', undefined, { TREND: { reading: 'BULLISH', strength: 80 } });
    const providerB = fixtureProvider('B', undefined, { TREND: { reading: 'BEARISH', strength: 60 } });
    const runNewAnalysis = jest.fn().mockReturnValue({
      fastTier: Promise.resolve({ participating: [{ providerId: 'A', result: stubResult() }, { providerId: 'B', result: stubResult() }], nonParticipating: [], totalRegistered: 2 }),
      slowTier: Promise.resolve({ participating: [], nonParticipating: [], totalRegistered: 0 }),
    });
    const service = await buildService([providerA, providerB], runNewAnalysis);

    const result = await service.computeConfluence(series());

    expect(result.dimensions).toHaveLength(7);
    const trend = result.dimensions.find((d) => d.dimension === 'TREND')!;
    expect(trend.disagreement).toBe(true);
    expect(trend.bullishContributors.map((c) => c.providerId)).toEqual(['A']);
    expect(trend.bearishContributors.map((c) => c.providerId)).toEqual(['B']);
  });

  describe('computeConfluenceWithEvidence (S1-019 WP1)', () => {
    it('returns a confluence field identical to computeConfluence() for the same series and providerResults for every participating Provider', async () => {
      const resultA = stubResult();
      const providerA = fixtureProvider('A', 'WYCKOFF', { TREND: { reading: 'BULLISH', strength: 80 } });
      const runNewAnalysis = jest.fn().mockReturnValue({
        fastTier: Promise.resolve({ participating: [{ providerId: 'A', result: resultA }], nonParticipating: [], totalRegistered: 1 }),
        slowTier: Promise.resolve({ participating: [], nonParticipating: [{ providerId: 'B', reason: 'TIMEOUT', detail: 'slow' }], totalRegistered: 1 }),
      });
      const service = await buildService([providerA], runNewAnalysis);

      const withEvidence = await service.computeConfluenceWithEvidence(series());
      const plain = await service.computeConfluence(series());

      expect(withEvidence.confluence).toEqual(plain);
      expect(withEvidence.providerResults).toEqual([{ providerId: 'A', methodologyFamily: 'WYCKOFF', result: resultA }]);
      // Full evidence IS present here, unlike computeConfluence()'s own bounded reference -- this method exists precisely to carry it.
      expect(JSON.stringify(withEvidence.providerResults)).toContain('secret internal trace detail');
    });

    it('invokes the Execution Engine exactly once per call -- never duplicates Provider invocation between the two public methods', async () => {
      const providerA = fixtureProvider('A', undefined, {});
      const runNewAnalysis = jest.fn().mockReturnValue({
        fastTier: Promise.resolve({ participating: [{ providerId: 'A', result: stubResult() }], nonParticipating: [], totalRegistered: 1 }),
        slowTier: Promise.resolve({ participating: [], nonParticipating: [], totalRegistered: 0 }),
      });
      const service = await buildService([providerA], runNewAnalysis);

      await service.computeConfluenceWithEvidence(series());
      expect(runNewAnalysis).toHaveBeenCalledTimes(1);
    });
  });
});
