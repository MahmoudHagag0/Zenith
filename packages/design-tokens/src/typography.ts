/**
 * Typography tokens -- values verbatim from D2-003_TYPOGRAPHY_SYSTEM.md §1-3.
 * Eight tiers: display, heading, title, subtitle, body, caption, micro,
 * numeric. `numeric` bakes in tabular-nums structurally (D2-003 §5.1 --
 * "mandatory, not a per-instance choice") so no consumer can omit it.
 */

export interface TypographyStep {
  readonly fontSize: string; // rem
  readonly lineHeight: number;
  readonly letterSpacing: string; // em
  readonly fontWeight: number;
}

export const fontFamilyText =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** Tabular-lining stack; `fontVariantNumeric` below is the binding requirement, not the family. */
export const fontFamilyNumeric = '"Inter", ui-monospace, monospace';

export const typography: Record<
  'display' | 'heading' | 'title' | 'subtitle' | 'body' | 'caption' | 'micro',
  TypographyStep
> = {
  display: { fontSize: '2.5rem', lineHeight: 1.2, letterSpacing: '-0.01em', fontWeight: 600 },
  heading: { fontSize: '1.75rem', lineHeight: 1.2, letterSpacing: '-0.01em', fontWeight: 600 },
  title: { fontSize: '1.375rem', lineHeight: 1.2, letterSpacing: '0em', fontWeight: 600 },
  subtitle: { fontSize: '1.0625rem', lineHeight: 1.5, letterSpacing: '0em', fontWeight: 500 },
  body: { fontSize: '1rem', lineHeight: 1.5, letterSpacing: '0em', fontWeight: 400 },
  caption: { fontSize: '0.875rem', lineHeight: 1.6, letterSpacing: '0em', fontWeight: 400 },
  micro: { fontSize: '0.75rem', lineHeight: 1.6, letterSpacing: '0.02em', fontWeight: 400 },
} as const;

/** D2-003 §5: numeric figures inherit surrounding context's size (not an independent tier) but always carry `font-variant-numeric: tabular-nums`. */
export const numericFontVariant = 'tabular-nums';

/** D2-003 §4: body-text reading width, 50-75 characters. */
export const proseMaxWidthCh = 75;
