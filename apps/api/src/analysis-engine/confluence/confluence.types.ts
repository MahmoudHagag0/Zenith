import type { NonParticipationReason } from '../providers/provider-execution.types';
import type { NormalizedDimension, NormalizedReading } from '../providers/normalized-vocabulary.types';
import type { AnalysisProviderResult } from '../providers/analysis-provider.types';

/**
 * Confluence-specific types (S1-012 Sprint Brief; ADR-007). This module
 * contains no Wyckoff/ICT-SMC/Elliott-Wave-specific logic — it consumes
 * only the generic `NormalizedProviderOutput` shape every Provider's
 * `normalize()` already produces, and the generic `ExecutionRunResult`
 * shape the Execution Engine (S1-008) already produces.
 */

/**
 * Pluggable weighting strategy (ADR-007). `EqualWeightStrategy` is the
 * only implementation this phase; a future data-driven strategy plugs in
 * here without any Provider or Confluence Engine contract change. Every
 * implementation, present or future, must return a `weightExplanation`
 * alongside the weight, so Confluence's explainability guarantee holds
 * even once real differential weighting exists.
 */
export interface ConfluenceWeightStrategy {
  computeWeight(providerId: string, methodologyFamily: string | undefined): { readonly weight: number; readonly weightExplanation: string };
}

/** A Provider's contribution to one dimension's aggregation, before family grouping. */
export interface DimensionContribution {
  readonly providerId: string;
  readonly methodologyFamily?: string;
  readonly reading: NormalizedReading;
  readonly strength: number;
}

/** One dimension's final aggregate, after family-aware, weighted aggregation. Full per-Provider traceability is never embedded here — see `ProviderReference`. */
export interface DimensionContributor {
  readonly providerId: string;
  readonly reading: 'BULLISH' | 'BEARISH';
  readonly confidence: number;
}

export interface DimensionConfluence {
  readonly dimension: NormalizedDimension;
  readonly aggregateReading: NormalizedReading;
  /** True only when at least one contributing family reads BULLISH and at least one reads BEARISH — never inferred from magnitude. */
  readonly disagreement: boolean;
  /** Up to the top 3 BULLISH-reading contributors by their own confidence (Finding C's recommendation) — bounded regardless of Provider count. */
  readonly bullishContributors: readonly DimensionContributor[];
  /** Up to the top 3 BEARISH-reading contributors by their own confidence. */
  readonly bearishContributors: readonly DimensionContributor[];
}

/** A Provider reference — `providerId`/`methodologyFamily` only. Full traceability is recoverable from the same call's own `AnalysisProviderResult[]`, never embedded here (ADR-007, payload-size bound). */
export interface ProviderReference {
  readonly providerId: string;
  readonly methodologyFamily?: string;
}

export interface ProviderParticipationSummary {
  readonly participating: readonly ProviderReference[];
  readonly nonParticipating: readonly { readonly providerId: string; readonly reason: NonParticipationReason; readonly detail: string }[];
}

/** The Confluence Engine's complete output for one series (S1-012 Sprint Brief, Scope item 9). Never resolves disagreement into a false consensus — see `DimensionConfluence.disagreement`. */
export interface ConfluenceResult {
  /** Always length 7 — one entry per ratified dimension, in the same order as `NormalizedDimension`. */
  readonly dimensions: readonly DimensionConfluence[];
  readonly participation: ProviderParticipationSummary;
}

/**
 * One participating Provider's own complete, unmodified result (S1-019
 * Sprint Brief, Scope item 1) — carried alongside `ConfluenceResult` only
 * by `computeConfluenceWithEvidence()`, never by `computeConfluence()`
 * (ADR-007's own payload-size bound still governs the latter). Exists
 * because a real Consumer (the Dashboard's Confluence Engine Consumer,
 * S1-019) needs each contributing Provider's own `LabeledConfidence`
 * values, `Limitations`, and `TraceabilityRecord` — none of which
 * `ConfluenceResult` itself carries — without re-invoking the Execution
 * Engine a second time for the same series.
 */
export interface ParticipatingProviderResult {
  readonly providerId: string;
  readonly methodologyFamily?: string;
  readonly result: AnalysisProviderResult;
}

/**
 * `computeConfluenceWithEvidence()`'s own return shape (S1-019). `confluence`
 * is exactly what `computeConfluence()` would return for the same series —
 * the two methods share one internal execution run and normalization pass,
 * never duplicated (S1-019 Sprint Brief, Scope item 1's own Performance
 * rationale).
 */
export interface ConfluenceResultWithEvidence {
  readonly confluence: ConfluenceResult;
  readonly providerResults: readonly ParticipatingProviderResult[];
}
