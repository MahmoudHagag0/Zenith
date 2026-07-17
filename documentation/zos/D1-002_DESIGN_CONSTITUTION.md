# D1-002_DESIGN_CONSTITUTION

**Document ID:** ZOS-D1-002
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation

------------------------------------------------------------------------

# Purpose & Authority

`24_ZENITH_PRODUCT_CONSTITUTION.md` §14 already states eight permanent
Design Constitution rules. **This document does not amend, replace, or
re-vote any of them** — amendment of §13/§14 requires Constitution §16's
own governance process, which this document does not invoke. This
document is the **operational elaboration** those eight rules
anticipate needing: each of the eight is restated here as a family of
concrete, testable sub-rules, cross-referenced back to its parent rule,
plus additional binding rules for design decisions §14 did not
enumerate (density, iconography, responsive behavior) but that follow
directly from Constitution §5–§9 and ZXL.

Every rule below is binding on every future screen, component, and
visual design, per Constitution §15.2 ("Any implementation choice that
would violate §13 or §14 must stop and escalate"). A future design that
cannot satisfy a rule below must escalate to the Architecture Team —
this document does not grant discretion to silently deviate.

------------------------------------------------------------------------

# 1. Attention & Hierarchy Rules

*(Elaborates Constitution §14 rule 6; grounded in D1-001 §2.)*

1.1. Exactly one element occupies **Primary Attention** (ZXL §1.1) per
screen at any given time. No visual treatment may make two elements
compete for first glance.

1.2. Primary Attention's position is a structural layout requirement
(D1-005), not a styling compensation — a Primary element in a
low-attention region must not be "fixed" with heavier styling alone.

1.3. Visual weight (size, contrast, position) is assigned strictly by
Attention level (ZXL §1.1–1.4), never by how recently something was
computed, how large a number is, or how visually dramatic underlying
data happens to be (Constitution §8.3).

1.4. A design review that cannot state which single element is Primary
on a given screen has failed this rule — this is a required,
answerable question for every screen, not a subjective judgment call.

------------------------------------------------------------------------

# 2. Color & Signal Rules

*(Elaborates Constitution §14 rules 1–2; full system in D1-003.)*

2.1. Color carries meaning through a single, closed vocabulary defined
in D1-003 — no screen introduces a new color-meaning pairing locally.

2.2. Every foreground/background pairing meets WCAG 2.1 AA contrast
minimums, without exception, in both light and dark mode.

2.3. Directional financial data (gain/loss, price change) is never
communicated by color alone — a symbol or label always carries the
primary signal, per D1-001 §4 and D1-003.

2.4. No screen uses saturated red/green specifically to dramatize a
losing versus winning position's own severity — per Constitution §7.3,
§12.4 and D1-001 §4/§7.

2.5. A color reserved for "requires attention" (alerts, warnings) is
never reused for a decorative or unrelated purpose anywhere in the
product — consistent with the existing operational-severity vocabulary
already established in `apps/api/src/monitoring/live-data-observability.types.ts`
(`CRITICAL`/`WARN`), which this system's own signal-color naming should
align with, not duplicate under different terms.

------------------------------------------------------------------------

# 3. Typography & Legibility Rules

*(Elaborates Constitution §14 rule 3; full system in D1-004.)*

3.1. All numeric and financial data uses tabular (fixed-width) figures
— digit alignment in any comparison context is mandatory.

3.2. Body text line length targets 50–75 characters at its default
container width (D1-001 §3).

3.3. A type scale has a small, fixed number of steps (D1-004) — no
screen introduces a one-off font size outside the scale.

3.4. Every text/background pairing meets the same WCAG 2.1 AA contrast
minimum as rule 2.2 — typography and color contrast are one
requirement, not two separately-checked ones.

------------------------------------------------------------------------

# 4. Whitespace & Density Rules

*(Elaborates Constitution §14 rule 4; grounded in D1-001 §3.)*

4.1. Whitespace is a required structural element, not remaining space —
no design review may "add content to fill space."

4.2. Information density on any single screen must not exceed what
ZXL §3.1 defines as the active-reasoning ceiling — a screen may display
more than a handful of elements only if the excess is Supporting or
Peripheral (ZXL §1.3–1.4), consulted rather than held in mind at once.

4.3. Deliberate visual silence (ZXL §5.3) is a valid, reviewable design
choice — a screen is not required to fill every region with a weighted
element.

------------------------------------------------------------------------

# 5. Motion Rules

*(Elaborates Constitution §14 rule 5; full system in D1-004.)*

5.1. Every animation has a defined reduced-motion equivalent honoring
`prefers-reduced-motion`, defined at the same time as the animation
itself, never retrofitted later.

5.2. Motion communicates continuity and cause only (Constitution §8.7)
— no animation exists to create excitement, urgency, or emphasis beyond
what the underlying evidence supports (rule 6 below).

5.3. No state change reads as alarm — a value update, a P/L
recalculation, or a status change never flashes, shakes, or pulses
rapidly, regardless of the magnitude of the underlying change (D1-001
§7).

------------------------------------------------------------------------

# 6. Anti-Urgency Rules

*(Elaborates Constitution §14 rule 7; ZXL §4.2, Experience Principle 6.)*

6.1. No color, motion, copy, or layout treatment implies time pressure
the disclosed evidence does not itself support.

6.2. No element uses a countdown, flashing badge, or unread-style
indicator to imply the trader must act now.

6.3. A genuinely time-sensitive fact (a market closing soon, an event
about to occur) is disclosed factually and calmly — its own factual
urgency is stated once, plainly, never amplified by design treatment on
top of the fact itself.

------------------------------------------------------------------------

# 7. Confidence & Uncertainty Parity Rules

*(Elaborates Constitution §14 rule 8; Constitution §6.5, §12.6–12.7; ZXL
Experience Principle 11.)*

7.1. Confidence and uncertainty disclosures use the same visual
treatment (size, weight, position pattern) in every context they
appear — neither is ever styled as more prominent than the other by
default.

7.2. A Confidence value never renders as a single undifferentiated
number in any visual design — its specific kind (per Constitution §6.5's
four-part taxonomy) is always identifiable from the visual presentation
itself, not only from adjacent text a trader might not read.

------------------------------------------------------------------------

# 8. Consistency Rules

*(Elaborates Constitution §14 rule 1 as it applies beyond color; D1-001
§10.)*

8.1. The same underlying concept (a Confidence value, a disclosed
limitation, a signal direction, an alert severity) uses the same visual
component and same token values everywhere it appears, across every
screen — a design system violation, not a style preference, if broken.

8.2. A new screen may introduce a new *layout arrangement* of existing
tokens/components; it may not introduce a new token, color, or type
step outside D1-003/D1-004 without an explicit, escalated decision.

------------------------------------------------------------------------

# 9. Accessibility Rules (Baseline)

*(Synthesizes rules 2.2, 3.4, 5.1 into one explicit accessibility
floor, since accessibility spans multiple categories above.)*

9.1. WCAG 2.1 AA is the accessibility floor for contrast, in both light
and dark mode, with no exceptions carved out for "temporary" or
"internal" screens.

9.2. `prefers-reduced-motion` is honored for every animated transition,
with no exceptions.

9.3. No information is conveyed by color alone anywhere in the product
(rule 2.3 generalized) — every color-coded signal has a redundant
non-color channel (symbol, label, icon, position).

------------------------------------------------------------------------

# 10. Iconography Rules

*(New category; follows directly from Constitution §5.1, Clarity Over
Decoration.)*

10.1. Icons are functional, never decorative — an icon exists only
where it speeds correct recognition of an action or state faster than
text alone would.

10.2. One consistent stroke weight and visual style across the entire
icon set — no mixing of filled and outlined styles for the same
semantic category.

10.3. Every icon that conveys meaning has an accessible text label or
equivalent (tooltip, `aria-label`) — an icon is never the sole carrier
of information.

------------------------------------------------------------------------

# 11. Responsive & Adaptive Rules

*(New category; grounded in D1-001 §1–§2, since attention scarcity and
cognitive load apply regardless of viewport.)*

11.1. Attention Hierarchy (ZXL §1) is preserved across breakpoints —
Primary Attention remains Primary at every supported viewport width; a
responsive collapse never promotes a Secondary/Supporting element above
Primary purely because of available space.

11.2. Where a viewport cannot show Supporting/Peripheral elements
without pushing Primary Attention out of the highest-attention region,
those elements are deferred (reachable, not deleted), never
compressed into the Primary region.

------------------------------------------------------------------------

# 12. Scope Boundary

This document, like ZXL, carries **no wireframe, no mockup, no final
component definition, and no new feature.** It states binding rules a
future visual design and component library must satisfy — it does not
perform that design or build that library. `26_DASHBOARD_HOME_SPECIFICATION.md`-style
per-screen specifications, and any future component library, are
checked against this document; this document does not itself constitute
either.

Rules above that reference a specific token, scale, or palette (§2, §3,
§4, §10) point to D1-003/D1-004 as the authoritative source of the
actual values — this document states the *rule the values must satisfy*,
not the values themselves.

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` (ZOS-024 §13,
  §14, §15 — frozen, elaborated here, not modified)
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` (ZOS-027 — frozen,
  cited, not modified)
- `documentation/zos/D1-001_UX_PSYCHOLOGY_RESEARCH.md`
- `documentation/zos/D1-003_COLOR_BEHAVIOR_SYSTEM.md`
- `documentation/zos/D1-004_DESIGN_SYSTEM_FOUNDATION.md`
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md`
- `documentation/zos/26_DASHBOARD_HOME_SPECIFICATION.md` (per-screen
  specification precedent, cited, not modified)
