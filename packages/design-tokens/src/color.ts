/**
 * Color tokens -- values verbatim from D2-002_COLOR_SYSTEM.md. Three-tier
 * structure per D1-003 §1: primitives (private, below) -> semantic tokens
 * (exported) -> theme mapping (light/dark, `themedColorVars` at the
 * bottom). No value here may be changed without an M4/D2 amendment --
 * this file is the single source `generate-css.ts` reads from.
 */

// ---- Primitive tokens (D2-002 §1-3) -- never referenced outside this file ----

const ink = {
  50: '#EEF1F6',
  100: '#D7DEEA',
  400: '#5B6B8C',
  600: '#33435F',
  700: '#26324A',
} as const;

const teal = {
  100: '#DCEEEA',
  500: '#3E7C72',
  700: '#2A5750',
} as const;

const neutral = {
  0: '#FFFFFF',
  50: '#F7F6F4',
  100: '#EDEBE7',
  400: '#8B877E',
  600: '#5B584F',
  800: '#332F2A',
  850: '#242320',
  900: '#211F1B',
  950: '#171613',
} as const;

// ---- Semantic tokens, per theme (D2-002 §4-11) ----

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

/** D2-002 §5, §7, §8: light-mode theme mapping. */
export const lightColorTokens: ThemeColorTokens = {
  surfaceBase: neutral[50],
  surfaceRaised: neutral[0],
  surfaceOverlay: neutral[0],
  textPrimary: neutral[900],
  textSecondary: neutral[600],
  textMuted: neutral[400],
  borderDefault: neutral[100],
  borderEmphasis: ink[600],
  accentDefault: ink[600],
  accentEmphasis: ink[700],
  accentFocus: ink[600],
  signalCritical: '#8C4A3D',
  signalWarn: '#8C6E3D',
  signalInfo: ink[600],
  success: '#3E8C5E',
  dataPositive: '#4F7D5E',
  dataNegative: '#A9695D',
  dataNeutral: neutral[600],
  chartSeries1: ink[600],
  chartSeries2: teal[500],
  chartSeries3: '#6B7C4A',
  chartSeries4: '#6B5B7C',
  chartSeries5: neutral[600],
} as const;

/** D2-002 §5, §7, §8: dark-mode theme mapping. */
export const darkColorTokens: ThemeColorTokens = {
  surfaceBase: neutral[950],
  surfaceRaised: neutral[850],
  surfaceOverlay: neutral[850],
  textPrimary: neutral[50],
  textSecondary: neutral[400],
  textMuted: neutral[600],
  borderDefault: neutral[800],
  borderEmphasis: ink[400],
  accentDefault: ink[600],
  accentEmphasis: ink[700],
  accentFocus: ink[400],
  signalCritical: '#8C4A3D',
  signalWarn: '#8C6E3D',
  signalInfo: ink[600],
  success: '#3E8C5E',
  dataPositive: '#4F7D5E',
  dataNegative: '#A9695D',
  dataNeutral: neutral[400],
  chartSeries1: ink[600],
  chartSeries2: teal[500],
  chartSeries3: '#6B7C4A',
  chartSeries4: '#6B5B7C',
  chartSeries5: neutral[400],
} as const;

/** Non-themed reference values (subtle tints, rarely consumed directly). */
export const referenceTints = {
  ink50: ink[50],
  ink100: ink[100],
  teal100: teal[100],
} as const;
