/**
 * Generates `css/tokens.css` from the TS token source -- run as this
 * package's own build step (`package.json` `build` script), never
 * hand-edited (M5-001 §1). One file, two theme blocks
 * (`[data-theme="light"]`/`[data-theme="dark"]`, M5-001 §2), plus the
 * single global reduced-motion override (M5-001 §9).
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { lightColorTokens, darkColorTokens, type ThemeColorTokens } from './color';
import { typography, fontFamilyText, fontFamilyNumeric, numericFontVariant } from './typography';
import { spacing, containerWidths } from './spacing';
import { radius } from './radius';
import { elevation } from './elevation';
import { duration, easing, reducedMotionDuration } from './motion';
import { opacity } from './opacity';
import { layer } from './layer';

/** CSS variable naming convention (M5-001 §3): `--zenith-{category}-{token}`, kebab-case. */
function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function colorVars(t: ThemeColorTokens): string {
  const map: Record<string, string> = {
    'surface-base': t.surfaceBase,
    'surface-raised': t.surfaceRaised,
    'surface-overlay': t.surfaceOverlay,
    'text-primary': t.textPrimary,
    'text-secondary': t.textSecondary,
    'text-muted': t.textMuted,
    'border-default': t.borderDefault,
    'border-emphasis': t.borderEmphasis,
    'accent-default': t.accentDefault,
    'accent-emphasis': t.accentEmphasis,
    'accent-focus': t.accentFocus,
    'signal-critical': t.signalCritical,
    'signal-warn': t.signalWarn,
    'signal-info': t.signalInfo,
    success: t.success,
    'data-positive': t.dataPositive,
    'data-negative': t.dataNegative,
    'data-neutral': t.dataNeutral,
    'chart-series-1': t.chartSeries1,
    'chart-series-2': t.chartSeries2,
    'chart-series-3': t.chartSeries3,
    'chart-series-4': t.chartSeries4,
    'chart-series-5': t.chartSeries5,
  };
  return Object.entries(map)
    .map(([k, v]) => `  --zenith-${k}: ${v};`)
    .join('\n');
}

function themeIndependentVars(): string {
  const lines: string[] = [];
  lines.push(`  --zenith-font-family-text: ${fontFamilyText};`);
  lines.push(`  --zenith-font-family-numeric: ${fontFamilyNumeric};`);
  for (const [step, def] of Object.entries(typography)) {
    lines.push(`  --zenith-text-${kebab(step)}-size: ${def.fontSize};`);
    lines.push(`  --zenith-text-${kebab(step)}-line-height: ${def.lineHeight};`);
    lines.push(`  --zenith-text-${kebab(step)}-letter-spacing: ${def.letterSpacing};`);
    lines.push(`  --zenith-text-${kebab(step)}-weight: ${def.fontWeight};`);
  }
  lines.push(`  --zenith-numeric-variant: ${numericFontVariant};`);
  for (const [k, v] of Object.entries(spacing)) {
    lines.push(`  --zenith-space-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(containerWidths)) {
    lines.push(`  --zenith-container-${kebab(k)}: ${v};`);
  }
  for (const [k, v] of Object.entries(radius)) {
    lines.push(`  --zenith-radius-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(elevation)) {
    lines.push(`  --zenith-elevation-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(duration)) {
    lines.push(`  --zenith-duration-${kebab(k)}: ${v};`);
  }
  for (const [k, v] of Object.entries(easing)) {
    lines.push(`  --zenith-easing-${kebab(k)}: ${v};`);
  }
  for (const [k, v] of Object.entries(opacity)) {
    lines.push(`  --zenith-opacity-${kebab(k)}: ${v};`);
  }
  for (const [k, v] of Object.entries(layer)) {
    lines.push(`  --zenith-layer-${kebab(k)}: ${v};`);
  }
  return lines.join('\n');
}

function reducedMotionBlock(): string {
  const overrides = Object.keys(duration)
    .map((k) => `    --zenith-duration-${kebab(k)}: ${reducedMotionDuration};`)
    .join('\n');
  return `@media (prefers-reduced-motion: reduce) {\n  :root {\n${overrides}\n  }\n}\n`;
}

/*
 * Theme resolution order (M5-001 §2, corrected during Dashboard
 * implementation self-review): both modes are first-class (D2-002
 * §6.1) and no manual toggle is a current requirement -- so the
 * default must resolve from `prefers-color-scheme` with NO JS/cookie
 * required, while still leaving room for an explicit `data-theme`
 * override (a future toggle) to win. `:root` carries light as the
 * fallback; a `prefers-color-scheme: dark` media query overrides it by
 * system preference; `[data-theme='light'|'dark']` rules are declared
 * last so an explicit attribute always wins the cascade (equal
 * specificity, later source order) once a toggle exists.
 */
const css = `/* GENERATED FILE -- do not edit by hand. Source: packages/design-tokens/src/*.ts (M5-001). */

:root {
${colorVars(lightColorTokens)}
${themeIndependentVars()}
}

@media (prefers-color-scheme: dark) {
  :root {
${colorVars(darkColorTokens)}
  }
}

[data-theme='light'] {
${colorVars(lightColorTokens)}
}

[data-theme='dark'] {
${colorVars(darkColorTokens)}
}

${reducedMotionBlock()}`;

const outDir = join(__dirname, '..', 'css');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'tokens.css'), css, 'utf8');
console.log(`@zenith/design-tokens: wrote ${join(outDir, 'tokens.css')}`);
