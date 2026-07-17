/**
 * Small, disclosed reference set of FRED series tracked by this Sprint
 * (L1-007, 28_LIVE_DATA_BLUEPRINT.md §9 Phase 7 Design Notes) -- mirrors
 * L1-004's CFTC contract-mapping-table precedent: start narrow and
 * extend over time, rather than attempting exhaustive FRED catalog
 * coverage upfront. Not an architectural decision; extending this list
 * requires no code change beyond adding a series ID.
 */
export const TRACKED_MACRO_SERIES = ['FEDFUNDS', 'CPIAUCSL', 'UNRATE', 'GDP'] as const;
