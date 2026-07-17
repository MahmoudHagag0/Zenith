/**
 * Elevation tokens -- values verbatim from D2-001_DESIGN_TOKENS.md §5.
 * Elevation and its shadow value are ONE token family, not two (M5-001
 * §8) -- there is no independent shadow scale to keep in sync.
 */
export const elevation = {
  0: 'none',
  1: '0 1px 2px rgba(0, 0, 0, 0.06)',
  2: '0 4px 12px rgba(0, 0, 0, 0.10)',
} as const;
