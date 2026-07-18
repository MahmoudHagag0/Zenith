/**
 * Typography tokens -- "Ivory Editorial" (Zenith's official visual
 * identity). Eight tiers: display, heading, title, subtitle, body,
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

/**
 * Signature choice: a system serif stack (no web font load -- OS-
 * installed, zero FOUT/licensing risk) used throughout, for a bold
 * print/magazine personality. Selected over a heavy grotesque sans and
 * a monospace alternative specifically because serif is the better
 * ergonomic choice for the Dashboard's own heaviest reading load (the
 * Decision Center's multi-sentence narrative) -- not merely a stylistic
 * pick.
 */
export const fontFamilyText = 'Georgia, Cambria, "Times New Roman", Times, serif';

export const fontFamilyNumeric = fontFamilyText;

export const typography: Record<
  'display' | 'heading' | 'title' | 'subtitle' | 'body' | 'caption' | 'micro',
  TypographyStep
> = {
  display: { fontSize: '3.25rem', lineHeight: 1.1, letterSpacing: '-0.01em', fontWeight: 700 },
  heading: { fontSize: '2.125rem', lineHeight: 1.15, letterSpacing: '-0.005em', fontWeight: 700 },
  title: { fontSize: '1.375rem', lineHeight: 1.25, letterSpacing: '0em', fontWeight: 700 },
  subtitle: { fontSize: '1.0625rem', lineHeight: 1.5, letterSpacing: '0em', fontWeight: 400 },
  body: { fontSize: '1.0625rem', lineHeight: 1.65, letterSpacing: '0em', fontWeight: 400 },
  caption: { fontSize: '0.9375rem', lineHeight: 1.6, letterSpacing: '0em', fontWeight: 400 },
  micro: { fontSize: '0.8125rem', lineHeight: 1.5, letterSpacing: '0.03em', fontWeight: 700 },
} as const;

/** D2-003 §5: numeric figures inherit surrounding context's size (not an independent tier) but always carry `font-variant-numeric: tabular-nums`. */
export const numericFontVariant = 'tabular-nums';

/** D2-003 §4: body-text reading width, 50-75 characters. */
export const proseMaxWidthCh = 70;
