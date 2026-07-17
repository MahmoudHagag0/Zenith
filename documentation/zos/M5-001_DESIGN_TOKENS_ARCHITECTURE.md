# M5-001_DESIGN_TOKENS_ARCHITECTURE

**Document ID:** ZOS-M5-001
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (engineering-authored implementation architecture)
**Milestone:** M5 — Implementation Architecture

------------------------------------------------------------------------

# Purpose

Implementation architecture only. Transforms D2-001 through D2-007
(values, rules, rationale — all frozen, cited by section, never
restated) into a production-ready frontend token delivery mechanism.
No value, color, rule, or visual language is invented or altered here.

**Grounding:** `apps/web` (Next.js 15, React 19) currently has no
token layer — `globals.css` is hand-written, hardcoded hex, explicitly
documented in its own header as pre-dating any design system. This
document specifies what replaces it. Monorepo already uses
`packages/*` workspace packages consumed via `workspace:*` (e.g.
`@zenith/tooling`) — the same pattern is used here.

------------------------------------------------------------------------

# 1. Package & Delivery Architecture

New workspace package: **`packages/design-tokens`** (`@zenith/design-tokens`).

```
packages/design-tokens/
├── src/
│   ├── color.ts        (D2-002)
│   ├── typography.ts    (D2-003)
│   ├── spacing.ts        (D2-004 §1)
│   ├── radius.ts          (D2-001 §4)
│   ├── elevation.ts        (D2-001 §5)
│   ├── motion.ts             (D2-001 §7-8)
│   ├── opacity.ts              (D2-001 §9)
│   ├── layer.ts                  (D2-001 §10)
│   ├── breakpoints.ts             (D2-004 §3)
│   ├── index.ts                    (barrel export — typed `tokens` object)
│   └── generate-css.ts              (build script → css/*.css)
├── css/
│   ├── tokens.css        (generated: custom properties, both themes)
│   └── reset.css          (minimal, non-visual — box-sizing etc. only)
└── package.json
```

**Single source of truth:** every token is authored once, in TypeScript,
in `src/`. `css/tokens.css` is generated from it (`generate-css.ts`,
run as a `packages/design-tokens` build step in the Turbo pipeline,
`dependsOn: ["^build"]` consistent with the existing `turbo.json`
convention) — never hand-edited. `apps/web` imports the generated CSS
once (`globals.css` → `@import '@zenith/design-tokens/css/tokens.css';`)
and the typed object for any non-CSS consumer (chart wrappers computing
canvas colors, tests asserting on token values).

**Consumption rule:** components (`packages/ui`, M5-002) reference CSS
custom properties only, never the TS object, never a raw hex/px value —
this is what makes Design Constitution rule 8.2 ("no new token without
an escalated decision") mechanically enforceable rather than aspirational.

------------------------------------------------------------------------

# 2. Theme Architecture

Implements D1-003 §1's three-tier structure exactly:

| Tier | Location | Example |
|---|---|---|
| Primitive | `src/color.ts`, private, not exported from `index.ts` | `ink600 = '#33435F'` |
| Semantic | Exported token name | `accentDefault` |
| Theme mapping | `generate-css.ts` — two blocks | light → `ink600`, dark → `ink400` |

**Mechanism:** generated CSS defines every semantic token as a custom
property under two selectors:

```css
:root, [data-theme="light"] { --zenith-surface-base: #F7F6F4; ... }
[data-theme="dark"]          { --zenith-surface-base: #171613; ... }
```

`data-theme` is set on `<html>` by the Theme Provider (M5-003 §5) —
default resolves from `prefers-color-scheme`, no manual toggle is a
design requirement (D2-002 §6.1 — both modes first-class, neither
default), but the attribute mechanism supports one if a future Sprint
adds it. No component ever reads `prefers-color-scheme` directly —
one point of resolution only (Design Constitution rule 8, consistency).

------------------------------------------------------------------------

# 3. Naming Convention

CSS custom property: `--zenith-{category}-{token}` (kebab-case),
1:1 with each D2 semantic token name. TS export: camelCase, nested by
category (`tokens.color.surface.base`).

| Category | CSS prefix | Source |
|---|---|---|
| Color (surface/text/border/accent/signal/data) | `--zenith-{surface,text,border,accent,signal,data}-*` | D2-002 |
| Typography | `--zenith-text-*`, `--zenith-line-height-*`, `--zenith-letter-spacing-*` | D2-003 |
| Spacing | `--zenith-space-{4,8,12,16,24,32,48,64,96}` | D2-004 §1 |
| Radius | `--zenith-radius-{none,sm,md,lg,full}` | D2-001 §4 |
| Elevation | `--zenith-elevation-{0,1,2}` | D2-001 §5 |
| Motion | `--zenith-duration-{fast,default,slow}`, `--zenith-easing-standard` | D2-001 §7-8 |
| Opacity | `--zenith-opacity-{disabled,hover,pressed,scrim}` | D2-001 §9 |
| Layer | `--zenith-layer-{base,raised,sticky,overlay,modal,toast}` | D2-001 §10 |
| Breakpoint | see §10 below (not a custom property — CSS limitation) | D2-004 §3 |

No token name is abbreviated, renamed, or reinterpreted from its D2
source across this table — a `grep` for a D2 token name and its CSS
variable name must both resolve to the same concept.

------------------------------------------------------------------------

# 4. Color Tokens

`src/color.ts` exports exactly D2-002 §1–§11's semantic set:
`surface.{base,raised,overlay}`, `text.{primary,secondary,muted}`,
`border.{default,emphasis}`, `accent.{default,emphasis,focus}`,
`signal.{critical,warn,info}`, `success`, `data.{positive,negative,neutral}`,
plus the categorical chart series (D2-002 §10, five values) — each
mapped for both `light` and `dark` per D2-002's own tables. Values are
copied verbatim from D2-002; this document defines structure only.

**Constraint carried forward (not re-derived):** `data.*` and `signal.*`
remain structurally distinct token families even though both render as
color — a component may never substitute one for the other (D1-003 §5.2,
`M4-010` §3's own COT precedent: raw evidence never borrows the
gain/loss token family).

------------------------------------------------------------------------

# 5. Typography Tokens

`src/typography.ts` exports D2-003 §1's eight-tier scale
(`display, heading, title, subtitle, body, caption, micro, numeric`) ×
`{fontSize, lineHeight, letterSpacing, fontWeight}`, plus the two font
stacks (§1: system-ui text stack, tabular-lining numeric stack).

**Structural enforcement of D2-003 §5.1** (tabular figures mandatory,
not per-instance): the `numeric` token's generated CSS rule bakes in
`font-variant-numeric: tabular-nums` directly — a component using
`--zenith-text-numeric` cannot render non-tabular digits by omission,
closing the one place D2-003 itself flagged as "not a per-instance
choice."

------------------------------------------------------------------------

# 6. Spacing Tokens

`src/spacing.ts`: `space.{4,8,12,16,24,32,48,64,96}` → `--zenith-space-*`,
values verbatim from D2-004 §1. No half-step or intermediate value is
added.

------------------------------------------------------------------------

# 7. Radius Tokens

`src/radius.ts`: `radius.{none,sm,md,lg,full}` → `--zenith-radius-*`,
values verbatim from D2-001 §4.

------------------------------------------------------------------------

# 8. Elevation & Shadow Tokens

**Architecture note:** D2-001 §5 defines elevation and its shadow value
as *one* token family, not two — `elevation.1`'s shadow value is not a
separate, independently-selectable token. This document does not
introduce a second shadow vocabulary to satisfy the task's own
"Shadow tokens" heading separately; doing so would violate "never
invent new visual language." `--zenith-elevation-{0,1,2}` resolves
directly to the `box-shadow` value D2-001 §5 specifies per step — one
token, one CSS property, no independent shadow scale.

------------------------------------------------------------------------

# 9. Motion Tokens

`src/motion.ts`: `duration.{fast,default,slow}` (120/200/320ms),
`easing.standard` (`cubic-bezier(0.2, 0, 0, 1)`), verbatim D2-001 §7-8.

**Reduced-motion enforcement (single point, per D1-004 §4 rule 4.1):**
`generate-css.ts` emits one global block:

```css
@media (prefers-reduced-motion: reduce) {
  :root { --zenith-duration-fast: 0ms; --zenith-duration-default: 0ms;
           --zenith-duration-slow: 0ms; }
}
```

Every component's transition already references `--zenith-duration-*`
(§1's consumption rule) — this single override collapses all motion to
instant, with no per-component reduced-motion logic required. This is
the one architecture decision in this document not explicit in D2-001
itself (which states the *rule*, not the delivery mechanism) — it
satisfies the rule without altering it.

------------------------------------------------------------------------

# 10. Opacity Tokens

`src/opacity.ts`: `opacity.{disabled,hover,pressed,scrim}`
(0.4/0.06/0.12/0.5), verbatim D2-001 §9.

------------------------------------------------------------------------

# 11. Z-Index / Layer Tokens

`src/layer.ts`: `layer.{base,raised,sticky,overlay,modal,toast}`
(0/10/20/30/40/50), verbatim D2-001 §10.

------------------------------------------------------------------------

# 12. Breakpoint Tokens

**Technical constraint (not a design decision):** CSS custom properties
cannot be referenced inside a `@media` condition. Breakpoints therefore
exist in two synchronized places, both generated from
`src/breakpoints.ts`:

1. Literal values written directly into every `@media` rule across
   `packages/ui` component stylesheets (M5-002) — generated/verified by
   a lint rule (`stylelint` custom rule or a `grep`-based CI check)
   comparing against `breakpoints.ts`, not hand-maintained independently.
2. The typed `tokens.breakpoint.{compact,regular,wide}` object, consumed
   by any JS logic needing viewport-aware behavior (e.g. Peripheral-row
   collapse logic, D1-005 §5.1-§5.2).

Values verbatim D2-004 §3 (`<640px / 640–1023px / ≥1024px`).

------------------------------------------------------------------------

# Compliance Check

- Every token category the task requires (theme, color, typography,
  spacing, radius, elevation, motion, shadow, opacity, z-index,
  breakpoint) is covered above with an explicit D2 source citation.
- No value differs from its D2 source; no new category was introduced
  beyond §8's explicit non-introduction of a second shadow vocabulary.
- Naming is 1:1 traceable both directions (D2 token ↔ CSS variable ↔ TS
  export).

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/D1-003_COLOR_BEHAVIOR_SYSTEM.md` §1 (tier structure)
- `documentation/zos/D2-001_DESIGN_TOKENS.md` through `D2-004_SPACING_LAYOUT_SYSTEM.md` (value source)
- `documentation/zos/D1-004_DESIGN_SYSTEM_FOUNDATION.md` §4 (reduced-motion rule)
- `documentation/zos/M5-002_SHARED_COMPONENT_LIBRARY_ARCHITECTURE.md` (token consumer)
- `documentation/zos/M5-003_FRONTEND_FOUNDATION_ARCHITECTURE.md` (Theme Provider)
