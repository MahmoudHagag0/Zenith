# D1-001_UX_PSYCHOLOGY_RESEARCH

**Document ID:** ZOS-D1-001
**Version:** 1.0.0
**Status:** Proposed — Awaiting Product Leadership Review
**Owner:** Architecture Team (leadership-authored philosophy; engineering-maintained specification)
**Milestone:** M4 — Design Foundation

------------------------------------------------------------------------

# Purpose

This is the research base for Milestone M4 (Design Foundation). It does
not introduce new philosophy — `24_ZENITH_PRODUCT_CONSTITUTION.md` §5–§9
and `27_ZENITH_EXPERIENCE_LANGUAGE.md` (ZXL) already state Zenith's
binding psychological principles and cite their evidence inline. This
document instead **consolidates that evidence base in one place,
organized by theme rather than by section**, so that D1-002 through
D1-005 can cite a single research anchor per theme instead of
re-deriving it. Where this document adds a finding not already cited in
24 or 27, it is because that finding directly informs a foundation-level
decision (color, type, spacing, motion, layout) those two documents
deliberately did not make, since neither carries "visual design, color,
spacing, or pixel value" (ZXL, Scope Boundary).

Every claim is tagged per the Constitution's own Evidence Classification
Legend (`24_ZENITH_PRODUCT_CONSTITUTION.md` §0.3):
**[Established Evidence]**, **[Industry Best Practice]**, or
**[Zenith-Specific Decision]**. Nothing here is presented as settled
science unless it is.

------------------------------------------------------------------------

# 1. Working Memory & Cognitive Load

**Finding:** Working memory reliably holds only a small number of
discrete items under active manipulation — classically ~7 ± 2, narrowed
by later work to roughly 4 chunks for information genuinely being
reasoned about rather than passively held **[Established Evidence —
Miller (1956); Cowan (2001)]**. Cognitive Load Theory further
distinguishes intrinsic load (inherent task difficulty), extraneous load
(load added by poor presentation), and germane load (effort that builds
real understanding) **[Established Evidence — Sweller, Cognitive Load
Theory]**.

**Already governs:** Constitution §6.1, §12.2; ZXL §3 (Cognitive Load
Rules).

**New design implication for M4:** a design system's own visual density
— how many distinct type sizes, colors, spacing values, and elevation
levels exist — is itself extraneous load if the count exceeds what a
designer or trader can reliably distinguish. A **small, closed token
vocabulary** (D1-003, D1-004) is a direct application of minimizing
extraneous load at the system level, not only the screen level.

------------------------------------------------------------------------

# 2. Selective Attention & Eye Movement

**Finding:** Attention is scarce and sequential — a person gives full
conscious attention to essentially one thing at a time, and what draws
the eye first materially changes what is processed at all
**[Established Evidence — Broadbent's filter model and successors]**.
Eye-tracking research on digital reading shows strong, non-random
scan patterns (F-shaped, Z-shaped), with sharply declining attention
moving down and right from the top-left **[Established Evidence —
Nielsen Norman Group eye-tracking studies, incl. Nielsen's F-pattern
research (2006)]**.

**Already governs:** Constitution §6.4, §8.1, §8.2; ZXL §1 (Attention
Hierarchy).

**New design implication for M4:** the highest-attention region
identified by this research is a **layout constraint**, not only a
content-priority rule — D1-005 must place a screen archetype's Primary
Attention region inside it structurally, not rely on visual styling
alone to compensate for a poor position.

------------------------------------------------------------------------

# 3. Visual Perception & Legibility

**Finding:** Sufficient contrast between text/graphics and background is
required for legibility and accessibility, codified in WCAG 2.1's
contrast-ratio requirements **[Industry Best Practice, grounded in
controlled legibility research]**. Optimal line length for sustained
reading is roughly 50–75 characters **[Established Evidence — typographic
legibility research, corroborated across print and digital studies]**.
Numeric and financial data specifically benefits from tabular
(fixed-width) figures so digits align in comparison — a long-standing
financial-typesetting convention **[Industry Best Practice]**. Gestalt
figure-ground principles establish that whitespace is what allows a
viewer to separate meaningful content from its surroundings; removing it
measurably increases perceived complexity and search time
**[Established Evidence — Gestalt figure-ground research; visual-
complexity/search-time findings in HCI literature]**.

**Already governs:** Constitution §8.5, §8.6, §14 rules 2–4.

**New design implication for M4:** these are the direct source
constraints for D1-004's type scale (line-length, tabular figures) and
spacing scale (whitespace-as-structure, not filler).

------------------------------------------------------------------------

# 4. Color Perception, Association, and Accessibility

**Finding:** Popular "color psychology" claims (red = danger, green =
growth, blue = trust) are culturally contingent, weakly evidenced, and
frequently overstated in industry marketing material
**[Established Evidence, largely disconfirmed as a universal claim —
cross-cultural color-association research, e.g. Elliot & Maier's review
of color-in-context effects]**. What is well-supported is narrower:
color contrast requirements for legibility (WCAG 2.1) **[Industry Best
Practice]**, and that a small, consistently-applied color vocabulary
(one hue reserved exclusively for one meaning) measurably speeds correct
interpretation by reducing the number of associations a user must learn
and re-verify **[Established Evidence — redundancy/consistency findings
in visual-search literature]**.

**Already governs:** Constitution §8.4, §14 rules 1–2.

**New design implication for M4 (the central color-system decision):**
because color-as-emotion is weak evidence, and because Zenith's own
Product Rules forbid dramatizing losses relative to gains (Constitution
§7.3, §12.4; ZXL Experience Principle 10, §7.5 Revenge Trading), D1-003
must **not** adopt the conventional trading-app pattern of saturated
red/green for loss/gain. That pattern borrows exactly the
unsupported-authority color psychology this section disconfirms, while
actively working against Zenith's own evidence-grounded obligation to
present losing and winning positions with equal calm (Constitution
§3.3, §7.3). D1-003 instead treats directional sign (gain/loss) as a
**legibility problem solved primarily by symbol and typography** (a
leading `+`/`−`, tabular figures), with color used only as a secondary,
desaturated confirmation — never the primary or sole channel, which
also serves colorblind traders (~8% of men **[Established Evidence —
prevalence of red-green color vision deficiency, clinical
ophthalmology literature]**) who cannot reliably distinguish red from
green at all.

------------------------------------------------------------------------

# 5. Motion Perception & Vestibular Sensitivity

**Finding:** Motion in interfaces is well-used to communicate continuity
and cause — this changed because of that — a well-supported convention
across major design systems, grounded in perceptual-continuity research
**[Industry Best Practice]**. A documented minority of users experience
genuine physical discomfort (dizziness, nausea) from certain motion
patterns, particularly large-scale parallax or zoom **[Established
Evidence — vestibular-disorder literature on motion-triggered symptoms;
WCAG 2.1's own reduced-motion criterion]**.

**Already governs:** Constitution §8.7, §14 rule 5.

**New design implication for M4:** D1-004's motion tokens must define a
*reduced-motion equivalent for every animated transition*, not treat it
as an optional accessibility add-on layered in later.

------------------------------------------------------------------------

# 6. Trust & Automation Reliance

**Finding:** Trust in an automated or semi-automated system builds
slowly through consistent, calibrated performance and disclosure, and
can be destroyed quickly by a single instance of overconfidence later
proven wrong **[Established Evidence — Lee & See, "Trust in Automation"
(2004)]**.

**Already governs:** Constitution §5.3, §6.3, §11.4; ZXL §6 (Trust
Building).

**New design implication for M4:** visual consistency (D1-002, D1-003,
D1-004) is not a stylistic nicety — it is trust infrastructure. A design
token that renders "the same concept" differently across two screens
directly reintroduces the inconsistency this research identifies as
trust-eroding.

------------------------------------------------------------------------

# 7. Loss Aversion, Disposition Effect & Emotional Regulation

**Finding:** Losses are felt more intensely than equivalent gains — a
robust, much-replicated asymmetry **[Established Evidence — Kahneman &
Tversky, Prospect Theory (1979); Tversky & Kahneman (1991)]**. A direct
trading-specific consequence is the disposition effect: a documented
tendency to sell winners too early and hold losers too long, because
realizing a loss is felt as more painful than an unrealized one of the
same size **[Established Evidence — Shefrin & Statman (1985)]**. Trading
decisions made under acute emotional arousal are measurably lower
quality than the same decisions made calmly **[Established Evidence —
affect heuristic in risk judgment, e.g. Slovic et al.]**.

**Already governs:** Constitution §6.6, §7.3, §12.4; ZXL §4 (Calm
Interface), §7.5 (Revenge Trading).

**New design implication for M4:** this is the primary evidentiary
grounding for §4's color-system decision above, and for D1-004's motion
rule that no state change (a price update, a P/L recalculation) may
animate in a way that reads as alarm (a flash, a shake, a rapid color
pulse) — regardless of how large the underlying move is.

------------------------------------------------------------------------

# 8. Habit Formation & Reinforcement

**Finding:** Sustainable behavior change is built through consistent,
low-friction repetition of a cue-routine-reward loop, not willpower
alone **[Established Evidence — habit-formation literature, e.g. Lally
et al.]**. Reinforcement that is intermittent and unpredictable produces
stronger, more persistent conditioning than constant, predictable
reinforcement — the mechanism behind variable-ratio reward's addictive
pull **[Established Evidence — Skinner's variable-ratio reinforcement
research]**.

**Already governs:** Constitution §6.7, §7.2, §7.5, §12.3.

**New design implication for M4:** layout and IA (D1-005) must make the
*disciplined* path (review evidence → check journal → confirm process)
the structurally shortest, lowest-friction path through the navigation —
never a rewarding, variable, "see what's new" pattern (e.g., a
refresh-to-reveal gesture, a badge-count that resets unpredictably).

------------------------------------------------------------------------

# 9. Trading-Specific Decision Biases

**FOMO (Fear of Missing Out), Analysis Paralysis, Overconfidence,
Revenge Trading:** each already named and addressed at ZXL §7 (Decision
Psychology), which states the experiential countermeasure for each. This
document adds no new claim here — D1-002 through D1-005 cite ZXL §7
directly rather than restating it.

**Decision fatigue:** the general finding that decision quality degrades
across a long sequence of prior decisions is well-established at the
level of observed behavior; its proposed mechanism ("ego depletion") is
scientifically contested and has not reliably replicated
**[Established Evidence, contested mechanism — Baumeister's ego-depletion
theory; failed replications include Hagger et al.'s multi-lab study]**.
Constitution §6.2 already declines to depend on the contested mechanism
— this document does the same.

------------------------------------------------------------------------

# 10. Decision Velocity: Dual-Process Reasoning

**Finding:** Human judgment operates through two distinct systems: a
fast, automatic, intuitive mode (System 1) and a slower, deliberate,
effortful mode (System 2) **[Established Evidence — Kahneman,
dual-process theory, synthesized in "Thinking, Fast and Slow" (2011);
the same source Constitution §7.1 already cites for Prospect Theory]**.
System 1 is efficient but systematically biased; System 2 is
slower but corrects many of those biases when actually engaged — the
central practical problem is that System 2 is effortful and easily
skipped under time pressure or a low-friction interface that invites a
snap judgment.

**Already governs (indirectly):** Constitution §9.3 (Decision is "the
highest-stakes, most emotionally-loaded moment," demanding "maximal
clarity... and zero design pressure toward any particular action");
§9.4 (Execution's "friction-minimal *recording*, never friction-minimal
*impulse* — the two are deliberately not the same design goal");
Product Rule 5 (never reward overtrading).

**New design implication for M4:** Zenith's own interface must not
optimize every interaction for System-1 speed. A low-stakes, reversible
action (filtering a list, expanding a section) may be frictionless. A
consequential, evidence-weighing action (confirming a decision, dismissing
a disclosed limitation) should engage System 2 deliberately — not through
artificial delay or friction for its own sake, but by ensuring the
relevant evidence (§1–§7 above) is genuinely visible and read, not
skippable, before the action is available. See D1-002 §12 (Decision
Velocity Rules) for the binding rule this produces.

------------------------------------------------------------------------

# 11. Consistency & Usability Heuristics

**Finding:** Inconsistent presentation of the same underlying concept
measurably erodes trust and increases cognitive load, since a user must
re-learn what a recurring pattern means each time **[Established
Evidence — consistency heuristic, Nielsen's usability heuristics]**.

**Already governs:** Constitution §5.4, §14 rule 1; ZXL Experience
Principle 12.

**New design implication for M4:** this is the direct justification for
treating D1-002 (Design Constitution), D1-003 (Color), and D1-004
(Design System Foundation) as a **single closed system of tokens and
rules** rather than a per-screen decision — the entire point of a design
system, stated in research terms rather than industry-convention terms
alone.

------------------------------------------------------------------------

# Summary Table

| Theme | Primary Citation(s) | Governs (existing) | New M4 Implication |
|---|---|---|---|
| Working memory / cognitive load | Miller 1956; Cowan 2001; Sweller | Constitution §6.1, §12.2; ZXL §3 | Small, closed token vocabulary |
| Selective attention / eye movement | Broadbent; NN/g F-pattern | Constitution §6.4, §8.1–8.2; ZXL §1 | Primary Attention placed in top-attention region structurally |
| Legibility / whitespace | WCAG 2.1; Gestalt figure-ground | Constitution §8.5–8.6; §14.2–4 | Type scale, tabular figures, spacing-as-structure |
| Color perception & accessibility | Elliot & Maier; WCAG 2.1; visual-search literature | Constitution §8.4; §14.1–2 | No red/green loss-dramatization; symbol + desaturated color |
| Motion & vestibular sensitivity | Vestibular-disorder literature; WCAG 2.1 | Constitution §8.7; §14.5 | Reduced-motion equivalent mandatory per animation |
| Trust & automation reliance | Lee & See 2004 | Constitution §5.3, §6.3, §11.4; ZXL §6 | Consistency treated as trust infrastructure |
| Loss aversion / disposition effect | Kahneman & Tversky; Shefrin & Statman; Slovic et al. | Constitution §6.6, §7.3, §12.4; ZXL §4, §7.5 | Calm color/motion treatment regardless of favorability |
| Habit formation / reinforcement | Lally et al.; Skinner | Constitution §6.7, §7.2, §7.5, §12.3 | Disciplined path = shortest IA path |
| Decision velocity / dual-process reasoning | Kahneman, "Thinking, Fast and Slow" (2011) | Constitution §9.3, §9.4, Product Rule 5 | Consequential actions engage System 2 deliberately; low-stakes actions may stay System-1-fast |
| Trading-specific biases | See ZXL §7 | ZXL §7 | No new claim; cite directly |
| Consistency heuristics | Nielsen | Constitution §5.4, §14.1; ZXL Principle 12 | Design system as one closed rule set |

------------------------------------------------------------------------

# Related Documents

- `documentation/zos/24_ZENITH_PRODUCT_CONSTITUTION.md` (ZOS-024 —
  frozen, cited throughout, not modified)
- `documentation/zos/27_ZENITH_EXPERIENCE_LANGUAGE.md` (ZOS-027 — frozen,
  cited throughout, not modified)
- `documentation/zos/D1-002_DESIGN_CONSTITUTION.md`
- `documentation/zos/D1-003_COLOR_BEHAVIOR_SYSTEM.md`
- `documentation/zos/D1-004_DESIGN_SYSTEM_FOUNDATION.md`
- `documentation/zos/D1-005_LAYOUT_INFORMATION_ARCHITECTURE.md`
