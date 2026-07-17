# D2-003_TYPOGRAPHY_SYSTEM

**Document ID:** ZOS-D2-003
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation (Design System phase)

------------------------------------------------------------------------

# Purpose

The concrete implementation of D1-004 §1's typography scale. D1-004
established seven tokens (`text.display`, `text.heading.lg`,
`text.heading.sm`, `text.body`, `text.body.small`, `text.caption`,
`text.numeric`) with roles but no exact sizes. This document supplies
the exact scale and adds two intermediate tiers (`title`, `subtitle`)
and a lowest tier (`micro`) that D1-004 left room for but did not name
— disclosed below, not a contradiction (D1-004 §1's own scale is
described as illustrative of "a small, fixed number of steps," and
Design Constitution §8.2 permits an escalated addition; this document
is that escalation).

------------------------------------------------------------------------

# 1. Font Hierarchy

One system font stack (no custom webfont — reduces load time and
guarantees native OS legibility, an unglamorous but Constitution
§5.1-consistent choice: it earns its place by making reading easier,
not by looking distinctive) for all text, plus one monospace stack
reserved for numeric/tabular data:

- **Text stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Numeric stack:** a tabular-figure-capable monospace or tabular-lining
  sans (e.g. `"Inter", ui-monospace, ...` with `font-variant-numeric:
  tabular-nums` as the binding requirement, not the specific family)

| Token | Maps to D1-004 token | Size | Weight | Use |
|---|---|---|---|---|
| `text.display` | `text.display` | 2.5rem / 40px | 600 | Rare, single synthesis statement (D1-004 §1) |
| `text.heading` | `text.heading.lg` | 1.75rem / 28px | 600 | Screen/section titles |
| `text.title` | *(new — sub-tier of heading.lg)* | 1.375rem / 22px | 600 | Card/panel titles — D1-004's `text.heading.sm` renamed for clarity in this scale |
| `text.subtitle` | *(new — sub-tier of body)* | 1.0625rem / 17px | 500 | Secondary heading beneath a title |
| `text.body` | `text.body` | 1rem / 16px | 400 | Default reading text |
| `text.caption` | `text.body.small` | 0.875rem / 14px | 400 | Secondary/supporting text — D1-004's `text.body.small` renamed for clarity in this scale |
| `text.micro` | `text.caption` | 0.75rem / 12px | 400 | Labels, metadata, timestamps — D1-004's `text.caption` |
| `text.numeric` | `text.numeric` | Matches surrounding context's size | 400/600 | All numeric/financial data, tabular figures mandatory |

**Reconciliation note:** this table renumbers D1-004's naming (its
`heading.sm`→this scale's `title`, its `caption`→this scale's `micro`,
its `body.small`→this scale's `caption`) to match the user-facing
naming convention requested for this document, while keeping the exact
same *number* of tiers and the exact same *roles*. No screen may use a
size outside this table (Design Constitution §3.3) regardless of which
naming generation authored it.

------------------------------------------------------------------------

# 2. Line Heights

| Token | Value | Use |
|---|---|---|
| `lineHeight.tight` | 1.2 | `display`, `heading`, `title` |
| `lineHeight.default` | 1.5 | `body`, `subtitle` |
| `lineHeight.relaxed` | 1.6 | `caption`, `micro` when used in longer supporting copy |

Rationale: larger text needs less relative line-height to stay legible;
smaller text needs more, per standard typographic practice
**[Industry Best Practice]** — consistent with D1-001 §3's legibility
findings.

------------------------------------------------------------------------

# 3. Letter Spacing

| Token | Value | Use |
|---|---|---|
| `letterSpacing.tight` | -0.01em | `display`, `heading` (large sizes read better slightly tightened) |
| `letterSpacing.default` | 0 | `body`, `title`, `subtitle` |
| `letterSpacing.wide` | 0.02em | `micro` (all-caps labels, if used, need slight opening to stay legible at small size) |

------------------------------------------------------------------------

# 4. Reading Width

Body text container width targets 50–75 characters (D1-001 §3,
D1-002 §3.2) — approximately `60ch`–`75ch` as a CSS max-width on any
prose-style body-text container. This does not apply to tabular/
numeric layouts, which size to their own content and grid (D2-004).

------------------------------------------------------------------------

# 5. Numeric Typography

5.1. Every number a trader compares against another number (price,
P/L, percentage, confidence value) uses `text.numeric` with
`font-variant-numeric: tabular-nums` — mandatory, not a per-instance
choice (D1-004 §1 rule 1.2, Design Constitution §3.1).

5.2. `text.numeric` inherits its *size* from context (a numeric value
inside a `text.body` row uses `text.body`'s size, just with tabular
figures) — it is a figure-style modifier, not an independent size
tier.

5.3. Negative values use a leading `−` (true minus sign, not a hyphen)
and, where directional color is used, `data.negative` (D2-002 §11) —
never a parenthesized-red convention borrowed from print accounting,
which this system does not use.

------------------------------------------------------------------------

# 6. Financial Tables

6.1. Column headers use `text.micro` (uppercase optional, but if used,
`letterSpacing.wide` is mandatory for legibility).

6.2. All data cells use `text.numeric` with tabular figures, right-
aligned for numeric columns so digits align vertically across rows —
this is the entire reason tabular figures exist (D1-001 §3).

6.3. Row height is set by the spacing scale (D2-004), not by
typography — typography does not dictate layout rhythm in this system.

------------------------------------------------------------------------

# 7. Monospace Usage

Reserved exclusively for: (a) numeric/tabular data via
`font-variant-numeric` (§5), and (b) any literal code/identifier
occasionally surfaced to a trader (e.g. an API/error reference code).
Never used for body prose, headings, or any narrative/evidence text —
monospace reads as "technical/system output," which would undercut the
calm, professional register Constitution §11.1/ZXL §8 require for
everything a trader reads as Zenith's own voice.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` §8.5 (frozen, cited)
- `documentation/zos/D1-001_UX_PSYCHOLOGY_RESEARCH.md` §3
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` §3, §8.2
- `documentation/zos/D1-004_DESIGN_SYSTEM_FOUNDATION.md` §1 (implemented here in full)
- `documentation/zos/D2-001_DESIGN_TOKENS.md`
- `documentation/zos/D2-004_SPACING_LAYOUT_SYSTEM.md`
