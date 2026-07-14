import type { MarketSeries } from '../market-series/market-series.types';
import type { AnalysisProvider } from './analysis-provider.types';
import type { ParticipatingEntry, NonParticipatingEntry, TieredExecutionRun } from './provider-execution.types';

/**
 * The full registered Provider set, exposed as an array via a NestJS
 * multi-provider factory (ADR-006). Empty in production — S1-008
 * registers no real methodology Provider; the first is S1-009.
 */
export const ANALYSIS_PROVIDERS = 'ANALYSIS_PROVIDERS';

/**
 * Every consumer of the Execution Engine depends on this interface only
 * (ADR-005/ADR-006 token-based-injection precedent) — never on the
 * concrete `ProviderExecutionService` class.
 */
export interface ProviderExecutionEngine {
  /**
   * Invokes every `ACTIVE`, non-open-circuit Provider in dependency/tier
   * order. `DEPRECATED` and `RETIRED` Providers never participate in a
   * new run (Provider Lifecycle). Returns immediately with two pending
   * results — see `TieredExecutionRun`.
   */
  runNewAnalysis(series: MarketSeries): TieredExecutionRun;
  /**
   * Directly invokes one Provider by `id`, for historical/backtested
   * reproduction. `ACTIVE` or `DEPRECATED` only — a `RETIRED` Provider is
   * never executable, by any call path.
   */
  runProviderDirectly(providerId: string, series: MarketSeries): Promise<ParticipatingEntry | NonParticipatingEntry>;
}

export const PROVIDER_EXECUTION_ENGINE = 'PROVIDER_EXECUTION_ENGINE';

/** Re-exported for consumers that only need the Provider array's element type. */
export type { AnalysisProvider };
