# M6-003_VISUAL_DIRECTIONS

**Document ID:** ZOS-M6-003
**Version:** 1.0.0
**Status:** APPROVED — Direction A selected
**Owner:** Architecture Team
**Milestone:** M6 — Zenith Visual Identity Package (Phase 3)

------------------------------------------------------------------------

# Purpose

Three genuinely different visual directions, each a complete,
internally-consistent personality satisfying M6-001/M6-002 — not three
palette swaps of the same layout. Each is evaluated on the same eight
criteria, then one is selected as Zenith's official identity and the
other two are formally rejected (not archived as "maybe later").

------------------------------------------------------------------------

# Direction A — "Executive Intelligence"

**Personality:** A senior research desk. Warm neutral paper tone (not
clinical white, not cool gray), restrained deep ink-teal as the single
accent, confident and slightly editorial type hierarchy. Light-first,
with an equally deliberate (not auto-inverted) dark mode. Soft, barely-
there elevation; hairline borders more often than shadow. Generous
whitespace by default, with an explicit denser preset for tables.

**Advantages:** Directly continuous with Zenith's existing psychology
(calm, trust, non-dramatized) — lowest risk of contradicting four
milestones of established behavioral/UX work. Warm neutral backgrounds
reduce blue-light eye strain over long sessions relative to cool-gray
or pure-white alternatives. Editorial type hierarchy gives the product
a distinct, ownable "voice" independent of color (passes the grayscale
identity test cleanly).

**Disadvantages:** Warm-neutral-plus-serif-adjacent-headline territory
risks reading as *too* soft/editorial for a minority of traders who
associate professional trading tools with cooler, sharper aesthetics.
Requires real typographic discipline (a wide display/heading size jump)
to avoid feeling like a generic content site rather than a data
product.

**Psychological impact:** Reinforces trust and calm authority; lowest
anxiety-inducing potential of the three. Matches the "senior analyst,
not a terminal" personality (M6-001 §1) almost by definition.

**Professional trader suitability:** High. Traders read this as
"serious research tool," not "toy" or "terminal cosplay."

**Long-session comfort:** High — warm neutral + generous spacing + soft
elevation is the most fatigue-resistant combination of the three,
in both light and dark mode.

**Decision quality impact:** Positive — nothing in this direction
competes with the evidence for attention; typographic hierarchy alone
carries most of the reading order.

**Accessibility impact:** Favorable — a single restrained accent
against warm neutral is straightforward to verify at WCAG AA across
both modes; low surface/text contrast risk since text sits on raised
surfaces close to full-contrast regardless of theme.

**Maintenance impact:** Lowest of the three — smallest palette (one
accent, one neutral family, closed signal set), least bespoke per-
component styling required.

------------------------------------------------------------------------

# Direction B — "Premium Trading Terminal"

**Personality:** Dark-first, graphite/charcoal surfaces, a cool cyan-
teal accent with a restrained glow on focus/active states, monospace-
forward numeric display, tighter default spacing, sharper near-zero
radius, crisp 1px borders instead of shadow anywhere. Light mode exists
but is explicitly the secondary mode.

**Advantages:** Immediately reads as "serious trading software" to a
trader coming from Bloomberg/TradingView-adjacent tools; dark-first
suits pre-dawn/after-hours sessions without a mode switch; tighter
spacing raises on-screen information density, which some professional
traders explicitly prefer.

**Disadvantages:** This is the direction the Constitution and D2-002
explicitly and repeatedly reject by name — "Zenith is not a trading-
terminal aesthetic... does not borrow Bloomberg Terminal's... look."
Adopting it now would reverse a standing, named product decision, not
merely refresh colors. Treating light mode as secondary also directly
contradicts D2-002 §6.1's "both modes are first-class" requirement.
Tighter default spacing conflicts with M6-002 §6's calm-by-default
rhythm rule for synthesis surfaces like Dashboard.

**Psychological impact:** Higher alertness/urgency association (dark +
glow + density reads as "market is moving, stay sharp") — closer to
the addictive/hypervigilant pattern the Constitution's Calm Interface
principle (§5.2) exists to avoid, even without a single saturated
red/green in sight.

**Professional trader suitability:** High for a narrow segment (day-
traders who live in terminal-style tools); lower for the broader
"structured, evidence-based decision-making" trader Zenith is built for.

**Long-session comfort:** Mixed — dark mode itself is comfortable in
low light, but tighter density plus a glowing accent increases visual
fatigue over a genuinely long (6+ hour) session relative to Direction A.

**Decision quality impact:** Risk of the interface's own intensity
competing with the evidence for attention — exactly the failure mode
M6-001 §15's decision-first philosophy is written to catch.

**Accessibility impact:** Glow effects and very tight spacing are
harder to keep WCAG-clean across zoom levels and require more contrast
tuning per state (rest/hover/active/focus) than Direction A.

**Maintenance impact:** Highest — glow states, monospace fallback
handling, and a genuinely different light-mode treatment (since it
can't just be an inversion) roughly double the surface area to
maintain and re-verify.

**Disposition: rejected.** Not merely "not chosen this round" — this
direction contradicts a named, standing decision (D1-003/D2-002's
explicit anti-Bloomberg/TradingView/MetaTrader clause) and the Calm
Interface principle. Revisiting it would require re-opening Constitution
§5.2 itself, which is outside this milestone's authority.

------------------------------------------------------------------------

# Direction C — "Modern Intelligence"

**Personality:** Cool neutral (blue-gray) light-first palette, a single
vivid indigo/violet accent, geometric sans throughout (no editorial
contrast between headline and body), rounded-soft cards with a
slightly more generous radius, airy spacing, gentle tinted-neutral
section backgrounds. Reads as contemporary B2B SaaS / fintech-modern.

**Advantages:** Immediately legible as "modern, well-funded software"
to a broad, non-specialist audience; geometric sans is easy to source
and pair with any numeric/monospace fallback; generous radius and
tinted sections give visually pleasant separation between blocks
without needing strong shadows.

**Disadvantages:** Indigo/violet-plus-rounded-soft is presently the
single most common "modern SaaS" visual signature (shared by a large
number of unrelated products) — weakest of the three against the
screenshot identity test (M6-001 §16.2): cropped with no logo, it is
easily mistaken for a generic B2B dashboard template, not specifically
Zenith. Geometric sans with no headline/body contrast under-serves
M6-001 §6's requirement that typography alone carry most of Zenith's
authority in the near-absence of imagery.

**Psychological impact:** Friendly and approachable, but "friendly"
under-serves the "senior analyst" personality — closer to a consumer
fintech app's reassurance register than a professional research desk's
authority register. Risk of reading as *less* serious about the
weight of the decisions it supports.

**Professional trader suitability:** Medium — comfortable, but a
professional trader managing real capital may read the friendliness as
undermining the product's credibility for high-stakes decisions.

**Long-session comfort:** Medium-high — airy spacing helps, but cool
blue-gray light backgrounds are measurably more blue-light-heavy than
Direction A's warm neutral over a multi-hour session.

**Decision quality impact:** Neutral to slightly negative — a single
vivid accent used generously (rounded pills, tinted section
backgrounds) risks the accent color drifting from "you can act here"
into ambient decoration, diluting the one-accent discipline
(M6-002 §12, M6-001 §16.5).

**Accessibility impact:** Favorable in principle (light, high native
contrast), but vivid indigo/violet accents need more careful per-shade
tuning to clear AA against both light and dark neutrals than
Direction A's more desaturated accent.

**Maintenance impact:** Medium — largest radius/spacing surface area
(more variants of "airy" treatment per component) but a conventional,
well-documented aesthetic family to build from.

**Disposition: rejected.** Not disqualified by a standing rule the way
Direction B is, but it underperforms Direction A on the two criteria
this milestone weights most heavily — the screenshot identity test and
the decision-first philosophy's one-accent discipline — while offering
no advantage Direction A does not already have at equal or lower
maintenance cost.

------------------------------------------------------------------------

# Comparison Summary

| Criterion | A — Executive Intelligence | B — Premium Trading Terminal | C — Modern Intelligence |
|---|---|---|---|
| Consistency with standing Constitution decisions | Full | **Contradicts D1-003/D2-002 anti-terminal clause** | Full |
| Screenshot identity test | Strong (editorial hierarchy, ownable) | Strong but wrong identity | Weak (generic SaaS) |
| Grayscale identity test | Strong | Medium (relies partly on glow) | Medium |
| Long-session comfort | Highest | Medium | Medium-high |
| Decision-first (evidence over ornament) | Strong | Weak (density/glow compete) | Medium (accent dilution risk) |
| Accessibility effort | Lowest | Highest | Medium |
| Maintenance cost | Lowest | Highest | Medium |

------------------------------------------------------------------------

# Selection

**Direction A — "Executive Intelligence" is selected as Zenith's
official visual identity.**

It is the only direction with no conflict against a standing,
named product decision; it scores highest on the two criteria this
milestone's own Constitution (M6-001) weights above all others —
decision-first evidence-over-ornament, and long-session comfort for a
professional trader — and it carries the lowest ongoing maintenance
and accessibility-verification burden. Directions B and C are formally
**rejected**, not deferred: B because it reopens Constitution §5.2 and
D1-003/D2-002's explicit anti-terminal decision, which is outside this
milestone's authority to revisit; C because it underperforms A on
identity distinctiveness and one-accent discipline while offering no
compensating advantage.

------------------------------------------------------------------------

# Related Documents

- M6-002_VISUAL_LANGUAGE.md — rules each direction was judged against.
- M6-004_OFFICIAL_DESIGN_SYSTEM.md — next phase, concrete values for Direction A.
