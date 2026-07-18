/**
 * Breakpoint tokens -- values verbatim from D2-004_SPACING_LAYOUT_SYSTEM.md
 * §3. CSS custom properties cannot be referenced inside a `@media`
 * condition (M5-001 §12) -- these values are the one source both the
 * generated CSS's literal `@media` rules and any JS/TS viewport logic
 * must match; `generate-css.ts` reads this same object, never a second
 * copy.
 */
export const breakpoints = {
  compact: 0, // < 640px
  regular: 640, // 640-1023px
  wide: 1024, // >= 1024px
} as const;
