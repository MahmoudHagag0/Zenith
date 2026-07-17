# D2-004_SPACING_LAYOUT_SYSTEM

**Document ID:** ZOS-D2-004
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Design System phase)

------------------------------------------------------------------------

# Purpose

The concrete implementation of D1-004 §2 (Spacing Scale) and §3 (Grid
& Breakpoints), plus new content D1-004 did not cover: concrete
breakpoint values, container widths, and safe areas. Every rule here
implements, and does not contradict, D1-002 §4 (Whitespace & Density
Rules) and D1-005 (Layout & Information Architecture).

------------------------------------------------------------------------

# 1. 8pt Spacing Philosophy

D1-004 §2 established a 4-based scale (4, 8, 12, 16, 24, 32, 48, 64).
This document states that scale's own governing philosophy explicitly:
**8px is the primary unit; 4px is a half-step reserved for the
tightest internal groupings only.** Nearly every spacing decision
should resolve to a multiple of 8 — this is the same scale, named for
its dominant unit rather than its smallest one, not a new or competing
scale.

| Token | Value | Tier |
|---|---|---|
| `space.4` | 4px | Half-step — icon-to-label gaps, tightest internal padding only |
| `space.8` | 8px | Base unit — default internal component padding |
| `space.12` | 12px | Small internal groupings |
| `space.16` | 16px | Default gap between related elements (D1-004 §2) |
| `space.24` | 24px | Separation between sub-sections |
| `space.32` | 32px | Separation between distinct sections/regions |
| `space.48` | 48px | Large section separation |
| `space.64` | 64px | Separation between a Primary Attention region and everything else (D1-004 §2 rule 2.2) |
| `space.96` | 96px | Page-level top/bottom margins on wide layouts only |

Rule: no spacing value exists outside this table (D1-004 §2 rule 2.1,
Design Constitution §4.1).

------------------------------------------------------------------------

# 2. Grid System

A 12-column grid at `breakpoint.wide`, collapsing per §3 below.
Gutters use `space.24` (wide), `space.16` (regular/compact).

## 2.1 Desktop (`breakpoint.wide`)

12 columns. Multi-column layouts permitted (D1-004 §3) — Primary
Attention (D1-005 §1) occupies a fixed column span (typically 8 of 12
for a Synthesis Archetype screen, D1-005 §2.1), never squeezed to
accommodate additional simultaneous columns.

## 2.2 Tablet (`breakpoint.regular`)

8 columns (or 12 collapsing to effectively single/dual-column
behavior for most content) — Secondary Attention may sit alongside
Primary (D1-004 §3), but Primary retains first position and largest
share.

## 2.3 Mobile (`breakpoint.compact`)

4 columns, effectively single-column for content flow — every screen
archetype collapses to one column with Primary Attention first in
document order (D1-005 §5.1, D1-002 §11.1).

------------------------------------------------------------------------

# 3. Breakpoints (concrete values)

Completes D1-004 §3's named-but-unvalued breakpoints:

| Token | Range | Grid |
|---|---|---|
| `breakpoint.compact` | < 640px | 4 columns, single-column flow |
| `breakpoint.regular` | 640px – 1023px | 8 columns |
| `breakpoint.wide` | ≥ 1024px | 12 columns |

------------------------------------------------------------------------

# 4. Container Widths

| Token | Value | Use |
|---|---|---|
| `container.narrow` | 640px max | A single-column reading surface (e.g. a Conversational Archetype exchange, D1-005 §2.4) |
| `container.default` | 960px max | Standard content container inside a wide layout |
| `container.wide` | 1200px max | The outermost page container at `breakpoint.wide` — content never stretches edge-to-edge on large monitors, per D1-002 §4.1 (whitespace is structural, not filler) |

------------------------------------------------------------------------

# 5. Safe Areas

Minimum edge padding at every breakpoint, so content never touches the
viewport edge:

| Breakpoint | Horizontal safe area |
|---|---|
| `breakpoint.compact` | `space.16` |
| `breakpoint.regular` | `space.24` |
| `breakpoint.wide` | `space.32` (content itself capped by `container.wide`, §4) |

------------------------------------------------------------------------

# 6. Content Width Rules

6.1. Prose/body text respects D2-003 §4's 50–75 character target
regardless of container width — a wide container does not stretch a
paragraph to its full width; text content gets its own narrower
sub-container inside a wide layout.

6.2. Tabular/numeric content (financial tables, D2-003 §6) may use the
full available container width — the character-width rule applies to
prose, not to data grids.

------------------------------------------------------------------------

# 7. Whitespace Philosophy

Restates D1-004 §2 and D1-002 §4.1 as an implementation instruction:
whitespace is allocated from the scale in §1 deliberately, at every
region boundary, before any content is placed — not added afterward to
"fix" a cramped layout. A design review that finds a screen feeling
dense should first check whether §1's larger tiers (`space.32` and
above) are being used at section boundaries, before considering
whether content itself should be removed.

------------------------------------------------------------------------

# 8. Information Density Rules

Restates D1-002 §4.4's three density tiers with their concrete spacing
implication:

| Density tier | Spacing implication |
|---|---|
| Low (Synthesis Archetype, D1-005 §2.1) | Generous spacing — `space.32`+ between the Primary conclusion and supporting regions |
| Medium (List/Tracking, Record/Detail, D1-005 §2.2–2.3) | `space.16`–`space.24` between list items; `space.8`–`space.12` within an item's own internal layout |
| High (a single drilled-into record, reached only via Progressive Disclosure, D1-005 §3.1) | `space.8`–`space.16` — denser, but never below `space.4`'s half-step, and never at first render (D1-002 §4.4) |

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` §4, §11
- `documentation/zos/D1-004_DESIGN_SYSTEM_FOUNDATION.md` §2–§3 (implemented here in full)
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md` §1, §2, §5
- `documentation/zos/D2-001_DESIGN_TOKENS.md`
- `documentation/zos/D2-003_TYPOGRAPHY_SYSTEM.md` §4
