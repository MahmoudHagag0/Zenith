/** Motion tokens -- values verbatim from D2-001_DESIGN_TOKENS.md §7-8. */
export const duration = {
  fast: '120ms',
  default: '200ms',
  slow: '320ms',
} as const;

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

/**
 * D1-004 §4 rule 4.1 / D2-001 §8: every duration has a 0ms reduced-motion
 * equivalent. `generate-css.ts` emits this as a single global
 * `@media (prefers-reduced-motion: reduce)` override (M5-001 §9) --
 * this constant is that override's own source value, not a second scale.
 */
export const reducedMotionDuration = '0ms';
