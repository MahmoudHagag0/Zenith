/**
 * @zenith/design-tokens -- typed TS export, for non-CSS consumers only
 * (M5-001 §1: "any non-CSS consumer... rare, e.g. computing something
 * in JS/canvas for charts"). Every `packages/ui` / `apps/web` stylesheet
 * consumes the generated CSS custom properties (`css/tokens.css`)
 * instead -- never this object.
 */
import { lightColorTokens, darkColorTokens, referenceTints } from './color';
import { typography, fontFamilyText, fontFamilyNumeric, numericFontVariant, proseMaxWidthCh } from './typography';
import { spacing, containerWidths } from './spacing';
import { radius } from './radius';
import { elevation } from './elevation';
import { duration, easing, reducedMotionDuration } from './motion';
import { opacity } from './opacity';
import { layer } from './layer';
import { breakpoints } from './breakpoints';

export const tokens = {
  color: { light: lightColorTokens, dark: darkColorTokens, reference: referenceTints },
  typography: { steps: typography, fontFamilyText, fontFamilyNumeric, numericFontVariant, proseMaxWidthCh },
  spacing: { ...spacing, container: containerWidths },
  radius,
  elevation,
  motion: { duration, easing, reducedMotionDuration },
  opacity,
  layer,
  breakpoints,
} as const;

export type { ThemeColorTokens } from './color';
export type { TypographyStep } from './typography';
export { lightColorTokens, darkColorTokens };
export { typography, fontFamilyText, fontFamilyNumeric, numericFontVariant, proseMaxWidthCh };
export { spacing, containerWidths };
export { radius };
export { elevation };
export { duration, easing, reducedMotionDuration };
export { opacity };
export { layer };
export { breakpoints };
