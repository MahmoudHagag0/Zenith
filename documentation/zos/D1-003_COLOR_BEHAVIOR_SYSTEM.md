# D1-003_COLOR_BEHAVIOR_SYSTEM

**Document ID:** ZOS-D1-003
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation

------------------------------------------------------------------------

# Purpose

Defines Zenith's color system at the token/foundation level: what each
color means, why, and the rules governing its use — not final screens or
component skins. Operationalizes Constitution §8.4 (Color Psychology),
Design Constitution rules 2.1–2.5, and D1-001 §4 into a closed,
implementation-ready token set.

**Governing decision (stated once, applied throughout):** because
popular color-psychology claims are weak evidence (D1-001 §4) and
because Zenith's own Product Rules forbid dramatizing losses relative to
gains (Constitution §7.3, §12.4), this system does **not** use the
conventional saturated red/green trading-app pattern. Color here is a
disciplined, minimal signal vocabulary — never an attempt to manufacture
an emotional effect from hue.

------------------------------------------------------------------------

# 1. Token Architecture

Three tiers, standard to mature design systems **[Industry Best
Practice]**:

- **Primitive tokens** — raw color values (a neutral scale, one accent
  hue, signal hues). Never referenced directly by a component.
- **Semantic tokens** — role-based names (`surface.base`,
  `text.primary`, `signal.attention`) that map to primitives. Components
  reference semantic tokens only.
- **Theme mappings** — light and dark mode each map every semantic
  token to a specific primitive value. A component's code never changes
  between themes; only the mapping does.

This three-tier structure is what makes Design Constitution rule 8.2
("no new token without an escalated decision") enforceable in practice —
a new color need is a semantic-token proposal, reviewed once, not a
per-screen hex value.

------------------------------------------------------------------------

# 2. Neutral Scale

The base of the system. A single neutral ramp (e.g., 10–12 steps from
near-white to near-black) provides every surface, border, and
body-text color. Rationale: the overwhelming majority of any trading
screen is structural and textual, not signal-bearing (Constitution §5.1,
Clarity Over Decoration) — a large, calm, neutral surface area is the
correct default, with color reserved for the minority of elements that
actually need to signal something (D1-001 §4).

| Role | Example semantic token | Light mode direction | Dark mode direction |
|---|---|---|---|
| Page background | `surface.base` | Lightest neutral | Darkest neutral |
| Card / panel surface | `surface.raised` | Slightly lighter/whiter than base | Slightly lighter than base |
| Border / divider | `border.default` | Low-contrast neutral | Low-contrast neutral |
| Primary text | `text.primary` | Darkest neutral | Lightest neutral |
| Secondary text | `text.secondary` | Mid-neutral, AA-compliant on `surface.base` | Mid-neutral, AA-compliant on `surface.base` |
| Muted / disabled text | `text.muted` | Lower-contrast neutral (non-signal use only) | Lower-contrast neutral |

All pairings in this table must be independently contrast-checked
against WCAG 2.1 AA once real values are chosen (Design Constitution
2.2) — this document defines the *roles and relationships*, not final
hex values, per the "no final UI components" scope boundary.

------------------------------------------------------------------------

# 3. Accent Color

**One** restrained accent hue, used exclusively for interactive/
navigational affordances (a selected nav item, a primary button, a
focus ring) — never for data signaling. Rationale: reserving the accent
for interaction-only meaning keeps Design Constitution rule 1
enforceable (Constitution §5.4/§8.4) — a trader who sees the accent
color anywhere always knows it means "you can act here," never "this
number is good or bad."

| Role | Semantic token |
|---|---|
| Primary interactive element | `accent.default` |
| Interactive element, active/pressed | `accent.emphasis` |
| Focus indicator | `accent.focus` |

------------------------------------------------------------------------

# 4. Signal Colors (Attention Vocabulary)

A small, closed set of signal hues, each with exactly one meaning,
reused identically everywhere (Design Constitution 2.1, 2.5). Naming
deliberately aligns with the operational severity vocabulary already
established in the backend (`apps/api/src/monitoring/live-data-observability.types.ts`'s
`AlertSeverity`: `CRITICAL` / `WARN`) so the same word means the same
thing in code, data, and UI — a direct application of Constitution
§5.4's consistency-as-trust-signal principle across the full stack, not
only within the frontend.

| Semantic token | Meaning | Example use |
|---|---|---|
| `signal.critical` | A disclosed condition requires attention now (matches backend `CRITICAL`) | A circuit-open provider status; a data-freshness failure |
| `signal.warn` | A disclosed condition is degraded but not critical (matches backend `WARN`) | An elevated failure rate; a stale-but-usable reading |
| `signal.info` | Neutral, factual disclosure — not a warning | An informational note, a disclosed limitation |
| `signal.attention` (deprecated alias) | *(Do not introduce — use `critical`/`warn`/`info` directly; a generic "attention" token would blur the two-severity taxonomy above and violate rule 2.1's closed-vocabulary requirement.)* | — |

**Rule:** these three tokens are reserved exclusively for genuinely
disclosed, evidence-backed conditions (per Constitution §5.2's
anti-manufactured-urgency principle) — never used to make an otherwise
neutral element look more important.

------------------------------------------------------------------------

# 5. Directional / Financial Data (Gain, Loss, Net Direction)

This is the system's single most consequential departure from
conventional trading-UI color practice, and is stated explicitly rather
than left implicit:

5.1. **Symbol and typography carry the primary signal.** A leading
`+` / `−` (or an equivalent directional glyph) and tabular figures
(Design Constitution 3.1) communicate direction and magnitude without
requiring color at all — satisfying Design Constitution 2.3 and 9.3
(no information by color alone) and serving colorblind traders
(D1-001 §4) who cannot reliably distinguish red from green.

5.2. **Color, where used, is a secondary, desaturated confirmation —
never the primary channel and never saturated.** Two low-saturation
tokens (`data.positive`, `data.negative`) may tint the figure, but at a
contrast and saturation level clearly distinct from `signal.critical`/
`signal.warn` — a loss is a factual state, not an alert.

5.3. **No visual amplification by magnitude.** A −15% reading is not
rendered in a "louder" red than a −1% reading. Severity of color
never scales with the size of a gain or loss (Constitution §7.3,
§12.4; D1-001 §7) — this is the direct, concrete implementation of
"a losing position is presented with the same calm as a winning one."

5.4. **"No clear opportunity" / neutral outcomes use `text.secondary`,
never a signal color.** A neutral or absent reading is not itself an
alert condition and must not visually resemble one (Constitution
§12.4).

| Semantic token | Meaning | Saturation vs. `signal.*` |
|---|---|---|
| `data.positive` | Gain / upward direction, secondary confirmation only | Markedly lower |
| `data.negative` | Loss / downward direction, secondary confirmation only | Markedly lower |
| `data.neutral` | No net direction / no clear opportunity | Same as `text.secondary` (not a distinct hue) |

------------------------------------------------------------------------

# 6. Light & Dark Mode Strategy

6.1. Both modes are first-class — neither is a "default" with the other
as an afterthought filter. Every semantic token has an explicit mapping
in both theme tables.

6.2. Signal and data-directional tokens (§4, §5) preserve their relative
saturation relationship between modes — a warn condition must not
become visually louder than a critical one in dark mode due to
unadjusted contrast.

6.3. Contrast ratios are re-verified per mode independently once real
values exist (Design Constitution 2.2) — a pairing that passes in light
mode is not assumed to pass in dark mode.

------------------------------------------------------------------------

# 7. What This Document Does Not Do

- Does not specify final hex/OKLCH values — those are an implementation
  task, verified against WCAG tooling, deferred to the Sprint that
  builds the actual token file.
- Does not define component-level color application (a specific
  button's states, a specific chart's palette) — that is component-spec
  work, out of scope per the Design Foundation Package's own boundary.
- Does not introduce a new signal category beyond §4's closed set
  without an escalated decision (Design Constitution 8.2).

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` (ZOS-024 §7.3,
  §8.4, §14 — frozen, cited, not modified)
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` (ZOS-027 §7.5,
  Experience Principle 10 — frozen, cited, not modified)
- `documentation/zos/D1-001_UX_PSYCHOLOGY_RESEARCH.md` (§4, §7)
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md` (§2, §9)
- `documentation/zos/D1-004_DESIGN_SYSTEM_FOUNDATION.md`
- `apps/api/src/monitoring/live-data-observability.types.ts` (existing
  `AlertSeverity` vocabulary this system's signal-token naming aligns
  with)
