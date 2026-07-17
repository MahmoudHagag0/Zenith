/**
 * Color tokens -- values verbatim from M6-004_OFFICIAL_DESIGN_SYSTEM.md
 * (Direction A, "Executive Intelligence"), superseding D2-002's first-
 * draft values inside the unchanged three-tier structure (D1-003 §1):
 * primitives (private, below) -> semantic tokens (exported) -> theme
 * mapping (light/dark). No value here may be changed without an M6
 * amendment -- this file is the single source `generate-css.ts` reads
 * from. Every pairing below is WCAG 2.1 AA-verified against the
 * surface it is actually used on (M6-004 self-review corrections).
 */

// ---- Primitive tokens (M6-004 §1-7) -- never referenced outside this file ----

const paper = {
  light: '#F8F6F0',
  raisedLight: '#FFFFFF',
  darkBase: '#17150F',
  darkRaised: '#211E17',
  darkOverlay: '#262319',
} as const;

const ink = {
  textPrimaryLight: '#1C1A16',
  textSecondaryLight: '#5B564C',
  textMutedLight: '#6A6455',
  textPrimaryDark: '#F1EDE4',
  textSecondaryDark: '#B8B2A2',
  textMutedDark: '#9C9580',
} as const;

const border = {
  defaultLight: '#E4E0D6',
  emphasisLight: '#C9C3B4',
  defaultDark: '#343026',
  emphasisDark: '#4A4536',
} as const;

const tealAccent = {
  defaultLight: '#1F5E56',
  emphasisLight: '#163F3A',
  defaultDark: '#4FA79A',
  emphasisDark: '#6BC2B4',
  focusDark: '#5CB6A8',
} as const;

// ---- Semantic tokens, per theme (M6-004 §1-7) ----

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

/** M6-004 §1-7: light-mode theme mapping ("Executive Intelligence"). */
export const lightColorTokens: ThemeColorTokens = {
  surfaceBase: paper.light,
  surfaceRaised: paper.raisedLight,
  surfaceOverlay: paper.raisedLight,
  textPrimary: ink.textPrimaryLight,
  textSecondary: ink.textSecondaryLight,
  textMuted: ink.textMutedLight,
  borderDefault: border.defaultLight,
  borderEmphasis: border.emphasisLight,
  accentDefault: tealAccent.defaultLight,
  accentEmphasis: tealAccent.emphasisLight,
  accentFocus: tealAccent.defaultLight,
  signalCritical: '#8C4A3D',
  signalWarn: '#8A6E33',
  signalInfo: '#4B6478',
  success: '#4F7358',
  dataPositive: '#4F7358',
  dataNegative: '#8F5349',
  dataNeutral: ink.textMutedLight,
  chartSeries1: tealAccent.defaultLight,
  chartSeries2: '#A9695D',
  chartSeries3: '#8A6E33',
  chartSeries4: '#4B6478',
  chartSeries5: '#6B5670',
} as const;

/** M6-004 §1-7: dark-mode theme mapping ("Executive Intelligence"). */
export const darkColorTokens: ThemeColorTokens = {
  surfaceBase: paper.darkBase,
  surfaceRaised: paper.darkRaised,
  surfaceOverlay: paper.darkOverlay,
  textPrimary: ink.textPrimaryDark,
  textSecondary: ink.textSecondaryDark,
  textMuted: ink.textMutedDark,
  borderDefault: border.defaultDark,
  borderEmphasis: border.emphasisDark,
  accentDefault: tealAccent.defaultDark,
  accentEmphasis: tealAccent.emphasisDark,
  accentFocus: tealAccent.focusDark,
  signalCritical: '#C2897B',
  signalWarn: '#C9A968',
  signalInfo: '#8CA6B8',
  success: '#8CAE8F',
  dataPositive: '#8CAE8F',
  dataNegative: '#C2897B',
  dataNeutral: ink.textMutedDark,
  chartSeries1: tealAccent.defaultDark,
  chartSeries2: '#C2897B',
  chartSeries3: '#C9A968',
  chartSeries4: '#8CA6B8',
  chartSeries5: '#A68CAE',
} as const;

/** Non-themed reference values (subtle tints, rarely consumed directly). */
export const referenceTints = {
  accentTintLight: '#E4EEEC',
  accentTintDark: '#1C3733',
} as const;
