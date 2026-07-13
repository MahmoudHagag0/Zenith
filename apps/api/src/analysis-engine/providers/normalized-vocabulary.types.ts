/**
 * The Normalized Vocabulary Schema (ADR-007; `22_ANALYSIS_ENGINE_ARCHITECTURE.md`,
 * "Normalization"). Every `AnalysisProvider` translates its own
 * Evidence/Interpretation into this shared vocabulary via its own
 * `normalize()` method — decentralized by implementation, centralized by
 * specification: this schema, and the shared conformance test suite that
 * checks every implementation against it
 * (`normalize-vocabulary-conformance.spec.ts`), live in one place so the
 * seven dimensions mean the same thing across every Provider, present and
 * future. This file is generic, shared infrastructure — it lives
 * alongside `analysis-provider.types.ts`, not inside `confluence/`, since
 * every Provider must import it to implement `normalize()`, independent
 * of whether the Confluence Engine exists.
 *
 * The schema is additive and versioned (`vocabularySchemaVersion`): a
 * future eighth dimension (e.g. "Risk", explicitly excluded from this
 * phase — reserved for a future Risk Engine) requires a Decision Log
 * entry and a version bump, and defaults every existing Provider's
 * `normalize()` output to `NOT_APPLICABLE` for it until that Provider is
 * updated — no existing Provider's own code needs to change when a new
 * dimension is introduced.
 */

/** The seven ratified dimensions (v1). "Risk" is deliberately excluded — see the file-level doc comment. */
export type NormalizedDimension = 'TREND' | 'MOMENTUM' | 'LIQUIDITY' | 'STRUCTURE' | 'VOLATILITY' | 'VOLUME' | 'CONFIRMATION';

/**
 * A Provider with nothing to say about a dimension reports
 * `NOT_APPLICABLE` — never a fabricated `NEUTRAL` guess. `NEUTRAL` means
 * the Provider evaluated this dimension and found no directional bias;
 * `NOT_APPLICABLE` means this Provider's methodology has no native
 * concept for this dimension at all. Confluence aggregation (S1-012)
 * treats the two very differently: `NOT_APPLICABLE` entries are excluded
 * from a dimension's aggregate entirely, while `NEUTRAL` entries
 * participate and can still express "no bias" as a real vote.
 */
export type NormalizedReading = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'NOT_APPLICABLE';

/** One dimension's reading from one Provider. */
export interface NormalizedSignal {
  readonly dimension: NormalizedDimension;
  readonly reading: NormalizedReading;
  /** 0-100. This Provider's own confidence in this specific dimension's reading. Always 0 when `reading` is `NOT_APPLICABLE`. */
  readonly strength: number;
  /** Non-empty for every non-`NOT_APPLICABLE` reading — which of this Provider's own Evidence/Interpretation fields produced this reading. */
  readonly explanation: string;
}

/**
 * The complete output of one Provider's `normalize()` call — always
 * carries all seven dimensions (Providers report `NOT_APPLICABLE` for
 * dimensions their methodology does not natively address, rather than
 * omitting the entry), so every Consumer can treat every Provider's
 * output identically without checking for missing keys.
 */
export interface NormalizedProviderOutput {
  readonly providerId: string;
  readonly methodologyFamily?: string;
  readonly vocabularySchemaVersion: string;
  readonly signals: readonly NormalizedSignal[];
}
