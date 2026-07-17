/**
 * Elevation tokens -- values verbatim from
 * M6-004_OFFICIAL_DESIGN_SYSTEM.md §10. Direction A resolves elevation
 * via hairline border as the primary technique, not shadow (M6-002
 * §3): `elevation.1` (Card) now carries no shadow at all -- its
 * separation comes from `border.emphasis`, applied directly in each
 * component's own CSS. `elevation.2` (modal/overlay) is the one
 * exception, since it must separate from page content behind a scrim,
 * not merely from a sibling on the same surface.
 */
export const elevation = {
  0: 'none',
  1: 'none',
  2: '0 8px 24px rgba(0, 0, 0, 0.24)',
} as const;

/**
 * `elevation.2` stays a single theme-independent value (unchanged
 * mechanism from M5-001 -- elevation is emitted once in `:root`, not
 * per theme): a neutral black shadow at this opacity separates a
 * floating overlay from a scrim in both light and dark contexts. Not
 * exercised by this milestone (Dashboard renders no modal/overlay).
 */
