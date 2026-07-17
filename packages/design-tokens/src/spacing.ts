/** Spacing scale -- values verbatim from D2-004_SPACING_LAYOUT_SYSTEM.md §1. */
export const spacing = {
  4: '0.25rem',
  8: '0.5rem',
  12: '0.75rem',
  16: '1rem',
  24: '1.5rem',
  32: '2rem',
  48: '3rem',
  64: '4rem',
  96: '6rem',
} as const;

/** D2-004 §4: container widths. */
export const containerWidths = {
  narrow: '40rem', // 640px
  default: '60rem', // 960px
  wide: '75rem', // 1200px
} as const;
