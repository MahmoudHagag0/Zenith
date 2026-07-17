# M6-001_VISUAL_IDENTITY_CONSTITUTION

**Document ID:** ZOS-M6-001
**Version:** 1.0.0
**Status:** APPROVED
**Owner:** Architecture Team
**Milestone:** M6 — Zenith Visual Identity Package (Phase 1)

------------------------------------------------------------------------

# Scope Note (read first)

This milestone's brief locks Dashboard content, Navigation, Psychology,
Decision Flow, and Information Architecture, and states "Everything
approved from Constitution, ZXL, D1, D2, M4, M5 is FINAL" — while in the
same breath instructing this phase to *define* backgrounds, surface
colors, accent colors, semantic colors, typography, radius, and
elevation from scratch, and to choose among three competing visual
directions. Read literally these two instructions conflict: D2 already
*is* the concrete color/typography/elevation specification.

**Resolution (stated once here, binding for the whole M6 package):**
"FINAL" applies to *structure and psychology*, not to D2's specific
numeric/hex values:

- **Locked, unchanged by M6:** D1's three-tier token architecture
  (primitive → semantic → theme), the closed signal vocabulary and
  its pairing rules (D1-002 §14 rule 8), the no-dramatization rule
  (Constitution §7.3), the single elevation family, the single global
  reduced-motion override, every UX/psychology/navigation/Decision Flow
  decision in ZXL/D1-005/M4/M5, and the Dashboard's own content,
  hierarchy, and layout (M4-003 series).
- **Deliberately revisited by M6:** D2-002 through D2-006's specific
  values — the actual hex palette, exact type scale numbers, exact
  radius/elevation numbers, motion easing curves. Those were a
  functional first draft, produced before any screen existed to
  validate against. M6 is the deliberate, brand-level pass that now
  replaces those specific values inside the *same* locked structure —
  the token *names* and *architecture* do not change; what a name like
  `accent.default` or `elevation.1` *resolves to* does.

Every existing consumer (`packages/ui`, the Dashboard) reads colors,
type, radius, and elevation exclusively through CSS custom properties
(M5-001 §3) — this is precisely what makes a values-only visual
identity pass possible without touching a single component file.

------------------------------------------------------------------------

# 1. Product Personality

Zenith is a **senior analyst, not a terminal.** If Zenith were a person
in the room while a trader made a decision, it would be the calm,
technically excellent colleague who has seen every kind of session —
euphoric, boring, and losing — and treats all three with the same
even tone. It does not perform urgency, does not celebrate, does not
scold. It states what the evidence shows and where that evidence is
weak, then steps back.

Three adjectives govern every visual decision below: **composed,
precise, unhurried.** A fourth — **confident** — governs their
ceiling: composed must never slide into flat or lifeless; precise must
never slide into cold; unhurried must never slide into slow-feeling
software.

# 2. Emotional Goals

| Zenith should make a trader feel... | Zenith must never make a trader feel... |
|---|---|
| Trusted to have checked the evidence | Sold to |
| In control of the decision | Pressured toward a decision |
| Respected as a professional | Gamified or rewarded like a consumer app |
| Calm enough to think clearly at hour 6 of a session | Alert-fatigued or anxious from the UI itself |
| That a loss and a win were reported with the same honesty | That the interface is rooting for either outcome |

# 3. Visual Philosophy

**Evidence over ornament.** Every pixel spent on decoration is a pixel
not spent on legibility of the evidence a trader is about to act on.
Zenith's visual richness comes from *restraint executed precisely* —
correct type hierarchy, correct spacing rhythm, correct one-accent
discipline — not from gradients, illustration, or decorative color.

**One voice, many screens.** A trader should be able to see a
cropped screenshot of any Zenith panel, with no chrome or logo visible,
and identify it as Zenith from typography and spacing alone.

# 4. Background Philosophy

The background is a **reading surface**, not a canvas for branding. It
recedes; content advances. Both light and dark modes are first-class
(Constitution/D2-002 §6.1) — Zenith is used across a trading day that
starts before dawn and ends after a session closes, and the product
must be equally considered in both conditions, never treating dark
mode as an afterthought inversion of light mode's values.

# 5. Color Philosophy

**One accent, used sparingly, means "you can act here."** Signal colors
(critical/warn/info) are a closed, desaturated vocabulary that never
doubles as brand decoration. Directional financial data (gains/losses)
is deliberately desaturated relative to what traders are used to from
Bloomberg/TradingView/MetaTrader — Zenith does not let color alone
carry the emotional weight of a P&L number; the number and its context
do that. This is a continuation of D1-003/D2-002's governing decision,
not a reversal of it.

# 6. Typography Philosophy

Typography is Zenith's primary source of visual authority — in a
product with almost no imagery, the type scale *is* the brand. Headline
tiers must read as unmistakably confident and considered, not merely
"large body text." Numeric data is typographically distinct from prose
at all times (tabular figures, consistent alignment) because a trader
scans numbers differently than they read sentences, and the interface
must support that different eye movement.

# 7. Layout Philosophy

Structure communicates priority before color does. A trader should be
able to mute all color (grayscale the entire screen) and still
correctly identify what matters most, purely from scale, weight, and
position (D1-002 §1 inheritance). Layout is calm and generously spaced
by default; density is a deliberate, opt-in property of specific
screens (tables, watchlists) — never the ambient default.

# 8. Card Philosophy

A card is a **container of trust**, not a decoration. Its visual weight
must never correlate with the favorability of the content inside it
(Constitution §7.3, M4-006 §6 — structurally enforced, no per-instance
override exists). Elevation exists to establish *reading order*
(what's foreground vs. background), never to add visual excitement.

# 9. Chart Philosophy

Charts exist to make a pattern legible, not to look impressive. Data
series use the closed chart-series palette (D2-006), never ad hoc
color. A chart with no clear reading is *shown as having no clear
reading* (via the existing confidence/uncertainty and empty-state
machinery) rather than rendered busy to look sophisticated.

# 10. Table Philosophy

Tables are a professional trader's most-used surface for repeated,
fast scanning. Numeric columns are right-aligned and tabular by
default; row density is a deliberate per-screen choice, never
ambient decoration; zebra striping (if used) is a functional scanning
aid at a near-invisible contrast, never a visual pattern.

# 11. Motion Philosophy

Motion confirms; it never entertains and never announces. Every
transition answers "did my action register" or "what changed" — never
"look at this." One duration/easing system, one global
reduced-motion override (unchanged from M5-001 §9); no component
invents its own timing.

# 12. Icon Philosophy

Icons are a scannable label, not decoration. A single, consistent
stroke-based icon family, used only where it measurably speeds
recognition over a text label (primary nav, status). Never used
alone without an accessible text equivalent (D2-007).

# 13. AI Presentation Philosophy

Every AI-originated statement is visually indistinguishable in *weight*
from a human-authored one — no chat bubble, no distinct "AI purple,"
no sparkle iconography implying magic. Confidence and Uncertainty are
always shown paired, at equal visual weight (D1-002 §14 rule 8,
unchanged). Zenith presents evidence-backed reasoning, not an oracle.

# 14. Accessibility Philosophy

Accessibility is not a pass at the end — every color pairing,
including the newly-selected accent, ships already verified against
WCAG 2.1 AA (D2-007) before it reaches a component. Reduced motion,
keyboard navigation, and screen-reader semantics are inherited
unchanged from D2-007 and are not weakened by any visual refresh.

# 15. Decision-First Philosophy

Every visual choice is judged against one question: **does this help a
trader reach a well-reasoned decision faster, or does it just look
nice?** A visual identity that wins a design award but adds a beat of
hesitation to reading a Decision Card has failed this milestone's
actual purpose, regardless of how the rest of this package reads.

------------------------------------------------------------------------

# 16. The Zenith Identity Test

Every future screen — and every review of an existing one — must pass
all seven of the following before it can ship:

1. **Grayscale test** — With all color removed, is hierarchy still
   completely legible from type/weight/spacing alone?
2. **Screenshot test** — Cropped with no logo or chrome visible, is it
   still unmistakably Zenith and not a generic dashboard template?
3. **Six-hour test** — Would this screen still be comfortable to read
   at hour six of a live session, at both normal and dimmed brightness?
4. **Equal-weight test** — Do a gain and an equivalent loss, or a high-
   and low-confidence reading, render with identical visual register
   (Constitution §7.3, D1-002 §14 rule 8)?
5. **One-accent test** — Does exactly one accent color mean "you can
   act here," with no second, competing "brand color" anywhere?
6. **Decision-speed test** — Does any animation, color, or ornament
   added here measurably help a trading decision, or does it only
   decorate?
7. **Both-modes test** — Was this reviewed as considered, finished
   work in *both* light and dark mode, not one designed and the other
   auto-inverted?

A screen that fails any of the seven does not ship as Zenith.

------------------------------------------------------------------------

# Related Documents

- 24_ZENITH_PRODUCT_CONSTITUTION.md — psychology this identity serves, unchanged.
- 27_ZENITH_EXPERIENCE_LANGUAGE.md — Decision Flow/Attention Hierarchy, unchanged.
- D1-002, D1-003, D2-001–D2-007 — structural rules inherited; specific values superseded per this document's Scope Note.
- M6-002_VISUAL_LANGUAGE.md — next phase, translates this philosophy into concrete visual rules.
