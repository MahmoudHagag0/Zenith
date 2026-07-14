import type { MarketSeries } from '../market-series/market-series.types';
import type { ConfluenceResult, ConfluenceResultWithEvidence } from './confluence.types';

/** Every consumer of the Confluence Engine depends on this interface only, never the concrete `ConfluenceService` class (ADR-003/005/006 token-injection precedent). */
export interface ConfluenceEngine {
  computeConfluence(series: MarketSeries): Promise<ConfluenceResult>;
  /**
   * Additive, S1-019. Returns the same `ConfluenceResult` `computeConfluence()`
   * would, plus each participating Provider's own complete, unmodified
   * `AnalysisProviderResult` — for a Consumer (e.g. the Dashboard's
   * Confluence Engine Consumer) that needs per-Provider Confidence/
   * Limitations/Traceability without re-running the Execution Engine.
   * Both methods share one execution run internally; this method never
   * duplicates Provider invocation or dimension aggregation.
   */
  computeConfluenceWithEvidence(series: MarketSeries): Promise<ConfluenceResultWithEvidence>;
}

export const CONFLUENCE_ENGINE = 'CONFLUENCE_ENGINE';
export const CONFLUENCE_WEIGHT_STRATEGY = 'CONFLUENCE_WEIGHT_STRATEGY';
