/**
 * "Ivory Editorial": completely flat -- no shadow anywhere, even for
 * overlays. Separation comes entirely from thick print-style rules
 * (`Card.module.css`), never depth.
 */
export const elevation = {
  0: 'none',
  1: 'none',
  2: 'none',
} as const;

/**
 * `elevation.2` stays a single theme-independent value (unchanged
 * mechanism from M5-001 -- elevation is emitted once in `:root`, not
 * per theme): a neutral black shadow at this opacity separates a
 * floating overlay from a scrim in both light and dark contexts. Not
 * exercised by this milestone (Dashboard renders no modal/overlay).
 */
