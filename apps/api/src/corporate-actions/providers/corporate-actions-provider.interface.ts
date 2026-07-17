export interface ProviderSplitEvent {
  effectiveDate: Date;
  /** toFactor / fromFactor -- e.g. 2 for a 2-for-1 split, 0.5 for a 1-for-2 reverse split. */
  ratio: number;
  providerEventId?: string;
  /** Full original provider payload for this event, preserved for audit/reproducibility. */
  raw: unknown;
}

export interface ProviderDividendEvent {
  effectiveDate: Date;
  amount: number;
  currency: string;
  providerEventId?: string;
  raw: unknown;
}

/**
 * A NEW provider interface (L1-006, 28_LIVE_DATA_BLUEPRINT.md §4.1: "NEW
 * interfaces required... CorporateActionsProvider") -- no prior Foundation
 * abstraction covers this domain. Follows the same interface + injection
 * token + Simulated-implementation pattern (ADR-003) as every prior
 * Live Data Sprint.
 *
 * Per Architecture Team decision (L1-006, 2026-07-16): results from this
 * provider are stored independently and are never used to mutate existing
 * `Candle` or `Position`/`Transaction` data. Any future adjustment
 * consumer must compute on read from the stored records; this interface
 * and its implementations only describe how raw corporate-action events
 * are fetched.
 */
export interface CorporateActionsProvider {
  readonly name: string;
  getSplits(symbol: string): Promise<ProviderSplitEvent[]>;
  getDividends(symbol: string): Promise<ProviderDividendEvent[]>;
}

export const CORPORATE_ACTIONS_PROVIDER = 'CORPORATE_ACTIONS_PROVIDER';
