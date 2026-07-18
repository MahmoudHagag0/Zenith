/**
 * Typography tokens -- values verbatim from
 * M6-004_OFFICIAL_DESIGN_SYSTEM.md §8 ("Executive Intelligence" --
 * editorial confidence via scale/weight contrast, not a new font
 * family). Eight tiers: display, heading, title, subtitle, body,
 * caption, micro, numeric. `numeric` bakes in tabular-nums structurally
 * (D2-003 §5.1 -- "mandatory, not a per-instance choice") so no
 * consumer can omit it.
 */

export interface TypographyStep {
  readonly fontSize: string; // rem
  readonly lineHeight: number;
  readonly letterSpacing: string; // em
  readonly fontWeight: number;
}

export const fontFamilyText =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/**
 * M6-004 §8 fix: previously declared a `"Inter"` fallback that was
 * never loaded via `@font-face`, so it silently resolved to
 * `ui-monospace, monospace` in every browser -- a dead, misleading
 * declaration. Tabular alignment comes from `numericFontVariant`
 * below (a font *feature*), not from a monospace family, so numeric
 * text now shares the same system sans stack as everything else.
 */
export const fontFamilyNumeric = fontFamilyText;

export const typography: Record<
  'display' | 'heading' | 'title' | 'subtitle' | 'body' | 'caption' | 'micro',
  TypographyStep
> = {
  display: { fontSize: '2.75rem', lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 700 },
  heading: { fontSize: '1.875rem', lineHeight: 1.2, letterSpacing: '-0.015em', fontWeight: 700 },
  title: { fontSize: '1.375rem', lineHeight: 1.2, letterSpacing: '0em', fontWeight: 600 },
  subtitle: { fontSize: '1.0625rem', lineHeight: 1.5, letterSpacing: '0em', fontWeight: 500 },
  body: { fontSize: '1rem', lineHeight: 1.6, letterSpacing: '0em', fontWeight: 400 },
  caption: { fontSize: '0.875rem', lineHeight: 1.6, letterSpacing: '0em', fontWeight: 400 },
  micro: { fontSize: '0.75rem', lineHeight: 1.6, letterSpacing: '0.03em', fontWeight: 500 },
} as const;

/** D2-003 §5: numeric figures inherit surrounding context's size (not an independent tier) but always carry `font-variant-numeric: tabular-nums`. */
export const numericFontVariant = 'tabular-nums';

/** D2-003 §4: body-text reading width, 50-75 characters. */
export const proseMaxWidthCh = 75;
