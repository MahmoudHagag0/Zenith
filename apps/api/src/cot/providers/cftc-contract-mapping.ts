/**
 * Internal futures-contract-to-Zenith-symbol mapping table (L1-004,
 * 28_LIVE_DATA_BLUEPRINT.md §9 Phase 4) -- mirrors the Internal Market
 * Sessions Table pattern from L1-002: a small, disclosed, extensible
 * reference set, not an exhaustive one, per the L1-004 Sprint Brief's
 * approved Scope (item 2) and Out of Scope ("exhaustive mapping-table
 * coverage... a small, disclosed, extensible starting set").
 *
 * Keyed by CFTC's own `cftc_contract_market_code` -- a stable contract
 * identifier, more reliable than the free-text `market_and_exchange_names`
 * field also present in the CFTC Socrata dataset. A symbol with no entry
 * here is a real, expected outcome (not every tracked asset has a
 * COT-reportable futures contract) -- LiveCotProvider returns an empty
 * report list for it, not an error (Sprint Brief Acceptance Criterion #2).
 */
export const CFTC_CONTRACT_MAPPING: Readonly<Record<string, string>> = {
  GOLD: '088691',
  'EUR/USD': '099741',
  WTI: '067651',
};
