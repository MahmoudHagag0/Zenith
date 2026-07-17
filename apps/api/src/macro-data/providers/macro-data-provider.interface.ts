export interface ProviderMacroSeriesValue {
  seriesId: string;
  observationDate: Date;
  value: number;
  /** Full original provider payload for this observation, preserved for audit/reproducibility. */
  raw: unknown;
}

/**
 * A NEW provider interface (L1-007, 28_LIVE_DATA_BLUEPRINT.md §4.1: "NEW
 * interfaces required... MacroDataProvider") -- no prior Foundation
 * abstraction covers this domain. Follows the same interface + injection
 * token + Simulated-implementation pattern (ADR-003) as every prior
 * Live Data Sprint.
 *
 * Per Architecture Team decision (L1-007, Scope Option A, 2026-07-17):
 * this Sprint is strictly limited to the Live Data layer -- provider,
 * normalization, persistence, cache, sync, and read-only APIs. No
 * consumer (NarrativeComposerService, WorkspaceService, or any other
 * Morning Brief/AI Workspace narrative) reads from this domain in this
 * Sprint; that integration belongs to the Zenith Intelligence Layer
 * after Live Data Milestone M3 is fully completed.
 */
export interface MacroDataProvider {
  readonly name: string;
  /** Returns the latest observation for a FRED series, or null if none is available. */
  getLatestSeriesValue(seriesId: string): Promise<ProviderMacroSeriesValue | null>;
}

export const MACRO_DATA_PROVIDER = 'MACRO_DATA_PROVIDER';
