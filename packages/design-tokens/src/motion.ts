/** Motion tokens -- values verbatim from D2-001_DESIGN_TOKENS.md §7-8. */
/**
 * M6-004 §12 fix: `slow` previously read `320ms` -- a fast flicker,
 * not a "slow, low-contrast pulse" (D2-005 §17). Its sole consumer is
 * `Skeleton`'s pulse animation, so retuning it to a genuinely slow
 * cycle affects nothing else.
 */
export const duration = {
  fast: '120ms',
  default: '200ms',
  slow: '1600ms',
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
