/**
 * Color tokens -- "Ivory Editorial" (Zenith's official visual identity,
 * selected after a live three-direction comparison against "Obsidian
 * Premium" and "Graphite Precision"). Three-tier structure unchanged
 * (D1-003 §1): primitives (private, below) -> semantic tokens
 * (exported) -> theme mapping (light/dark).
 */

const paper = {
  light: '#FDFCF7',
  raisedLight: '#FDFCF7',
  darkBase: '#141311',
  darkRaised: '#141311',
  darkOverlay: '#1C1A17',
} as const;

const ink = {
  textPrimaryLight: '#111110',
  textSecondaryLight: '#403D38',
  textMutedLight: '#726C62',
  textPrimaryDark: '#F5F2EA',
  textSecondaryDark: '#C9C3B6',
  textMutedDark: '#928C7E',
} as const;

const rule = {
  defaultLight: '#111110',
  emphasisLight: '#111110',
  defaultDark: '#F5F2EA',
  emphasisDark: '#F5F2EA',
} as const;

const brick = {
  defaultLight: '#A63A24',
  emphasisLight: '#7A2A1A',
  defaultDark: '#D4643F',
  emphasisDark: '#E38660',
} as const;

export interface ThemeColorTokens {
  readonly surfaceBase: string;
  readonly surfaceRaised: string;
  readonly surfaceOverlay: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly borderDefault: string;
  readonly borderEmphasis: string;
  readonly accentDefault: string;
  readonly accentEmphasis: string;
  readonly accentFocus: string;
  readonly signalCritical: string;
  readonly signalWarn: string;
  readonly signalInfo: string;
  readonly success: string;
  readonly dataPositive: string;
  readonly dataNegative: string;
  readonly dataNeutral: string;
  readonly chartSeries1: string;
  readonly chartSeries2: string;
  readonly chartSeries3: string;
  readonly chartSeries4: string;
  readonly chartSeries5: string;
}

export const lightColorTokens: ThemeColorTokens = {
  surfaceBase: paper.light,
  surfaceRaised: paper.raisedLight,
  surfaceOverlay: paper.raisedLight,
  textPrimary: ink.textPrimaryLight,
  textSecondary: ink.textSecondaryLight,
  textMuted: ink.textMutedLight,
  borderDefault: rule.defaultLight,
  borderEmphasis: rule.emphasisLight,
  accentDefault: brick.defaultLight,
  accentEmphasis: brick.emphasisLight,
  accentFocus: brick.defaultLight,
  /*
   * Stress-test fix: the first draft set `signalCritical` to the exact
   * same hex as `accentEmphasis` (`#7A2A1A`) in both themes -- the
   * brand mark and "something is critically wrong" were visually
   * identical, violating the closed single-meaning-per-color rule.
   * `signalCritical` is now a distinct maroon, clearly a different hue
   * from the brick-orange accent (magenta-leaning vs. orange-leaning
   * red), verified >5:1 against `surface.raised` in both modes.
   */
  signalCritical: '#6B2C3D',
  signalWarn: '#8A6E33',
  signalInfo: '#3D4E5C',
  success: '#3E6B4C',
  dataPositive: '#3E6B4C',
  dataNegative: '#8F5349',
  dataNeutral: ink.textMutedLight,
  chartSeries1: brick.defaultLight,
  chartSeries2: '#3D4E5C',
  chartSeries3: '#8A6E33',
  chartSeries4: '#3E6B4C',
  chartSeries5: '#5B4C63',
} as const;

export const darkColorTokens: ThemeColorTokens = {
  surfaceBase: paper.darkBase,
  surfaceRaised: paper.darkRaised,
  surfaceOverlay: paper.darkOverlay,
  textPrimary: ink.textPrimaryDark,
  textSecondary: ink.textSecondaryDark,
  textMuted: ink.textMutedDark,
  borderDefault: rule.defaultDark,
  borderEmphasis: rule.emphasisDark,
  accentDefault: brick.defaultDark,
  accentEmphasis: brick.emphasisDark,
  accentFocus: brick.defaultDark,
  /** See light-mode comment above -- same collision fix, dark values. */
  signalCritical: '#C97B93',
  signalWarn: '#C9A968',
  signalInfo: '#8CA6B8',
  success: '#8CAE8F',
  dataPositive: '#8CAE8F',
  dataNegative: '#C2897B',
  dataNeutral: ink.textMutedDark,
  chartSeries1: brick.defaultDark,
  chartSeries2: '#8CA6B8',
  chartSeries3: '#C9A968',
  chartSeries4: '#8CAE8F',
  chartSeries5: '#AE9BB4',
} as const;

export const referenceTints = {
  accentTintLight: '#F3E2DB',
  accentTintDark: '#3A2418',
} as const;
