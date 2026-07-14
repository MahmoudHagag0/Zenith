import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_PROVIDERS, PROVIDER_EXECUTION_ENGINE } from '../providers/analysis-provider.tokens';
import type { AnalysisProvider } from '../providers/analysis-provider.types';
import type { ProviderExecutionEngine } from '../providers/analysis-provider.tokens';
import type { MarketSeries } from '../market-series/market-series.types';
import type { NormalizedDimension, NormalizedProviderOutput } from '../providers/normalized-vocabulary.types';
import { aggregateDimension } from './confluence-dimension-aggregator.util';
import { CONFLUENCE_WEIGHT_STRATEGY } from './confluence.tokens';
import type { ConfluenceEngine } from './confluence.tokens';
import type {
  ConfluenceResult,
  ConfluenceResultWithEvidence,
  ConfluenceWeightStrategy,
  DimensionContribution,
  ParticipatingProviderResult,
} from './confluence.types';

const ALL_DIMENSIONS: readonly NormalizedDimension[] = ['TREND', 'MOMENTUM', 'LIQUIDITY', 'STRUCTURE', 'VOLATILITY', 'VOLUME', 'CONFIRMATION'];

/**
 * The Confluence Engine (S1-012 Sprint Brief, Scope item 9; ADR-007) —
 * aggregates normalized signals across every participating Provider.
 * Contains no Wyckoff/ICT-SMC/Elliott-Wave-specific logic: consumes only
 * the generic `ProviderExecutionEngine`/`ANALYSIS_PROVIDERS` (S1-008) and
 * each Provider's own generic `normalize()` output (this sprint). Awaits
 * both Execution Engine tiers fully — a complete, non-incremental V1
 * aggregation (incremental Confluence for future Alert-style Consumers
 * is explicitly deferred, per `22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s own
 * Future Compatibility section).
 *
 * The objective is never to vote or average confidence into one number —
 * `dimensions` reports each of the seven dimensions' own aggregate
 * reading *and* whether the participating Providers disagreed, with
 * attributed contributors per side (Finding C) — disagreement is
 * surfaced, never silently resolved.
 */
@Injectable()
export class ConfluenceService implements ConfluenceEngine {
  constructor(
    @Inject(PROVIDER_EXECUTION_ENGINE) private readonly executionEngine: ProviderExecutionEngine,
    @Inject(ANALYSIS_PROVIDERS) private readonly providers: readonly AnalysisProvider[],
    @Inject(CONFLUENCE_WEIGHT_STRATEGY) private readonly weightStrategy: ConfluenceWeightStrategy,
  ) {}

  async computeConfluence(series: MarketSeries): Promise<ConfluenceResult> {
    const { confluence } = await this.runAndAggregate(series);
    return confluence;
  }

  async computeConfluenceWithEvidence(series: MarketSeries): Promise<ConfluenceResultWithEvidence> {
    return this.runAndAggregate(series);
  }

  /**
   * The single internal execution/normalization/aggregation path shared by
   * both public methods (S1-019 Sprint Brief, Scope item 1) — the Execution
   * Engine is invoked exactly once per call to this method, regardless of
   * which public method the caller used, so no Provider is ever executed
   * twice for the same series in the same request.
   */
  private async runAndAggregate(series: MarketSeries): Promise<ConfluenceResultWithEvidence> {
    const run = this.executionEngine.runNewAnalysis(series);
    const [fastTier, slowTier] = await Promise.all([run.fastTier, run.slowTier]);

    const participatingEntries = [...fastTier.participating, ...slowTier.participating];
    const nonParticipatingEntries = [...fastTier.nonParticipating, ...slowTier.nonParticipating];

    const providerById = new Map(this.providers.map((provider) => [provider.id, provider]));

    const normalizedOutputs: NormalizedProviderOutput[] = participatingEntries.map((entry) => {
      const provider = providerById.get(entry.providerId);
      if (!provider) {
        // A genuine invariant violation (a participating entry the Execution Engine itself
        // resolved from ANALYSIS_PROVIDERS, yet absent from that very array) -- a real bug,
        // not a graceful-degradation case; this must throw, never silently skip a Provider.
        throw new Error(`ConfluenceService: participating Provider "${entry.providerId}" was not found in ANALYSIS_PROVIDERS.`);
      }
      return provider.normalize(entry.result);
    });

    const dimensions = ALL_DIMENSIONS.map((dimension) => {
      const contributions: DimensionContribution[] = normalizedOutputs.map((output) => {
        const signal = output.signals.find((s) => s.dimension === dimension);
        return {
          providerId: output.providerId,
          methodologyFamily: output.methodologyFamily,
          reading: signal ? signal.reading : 'NOT_APPLICABLE',
          strength: signal ? signal.strength : 0,
        };
      });
      return aggregateDimension(dimension, contributions, this.weightStrategy);
    });

    const confluence: ConfluenceResult = {
      dimensions,
      participation: {
        participating: normalizedOutputs.map((output) => ({ providerId: output.providerId, methodologyFamily: output.methodologyFamily })),
        nonParticipating: nonParticipatingEntries.map((entry) => ({ providerId: entry.providerId, reason: entry.reason, detail: entry.detail })),
      },
    };

    const providerResults: ParticipatingProviderResult[] = participatingEntries.map((entry) => {
      const provider = providerById.get(entry.providerId);
      return { providerId: entry.providerId, methodologyFamily: provider?.methodologyFamily, result: entry.result };
    });

    return { confluence, providerResults };
  }
}
