# S1-020_TASK_BREAKDOWN

**Document ID:** AI-047
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Execution-guidance breakdown for the approved `S1-020_SPRINT_BRIEF.md`
(Morning Brief Backend / Narrative Composer). Every Work Package below
maps directly to a numbered Scope item in the approved Brief.

# Proposed Module Layout

`apps/api/src/morning-brief/` (new):

- `morning-brief.types.ts` — Scope item 1.
- `narrative-composer.util.ts` (+ `.spec.ts`) — Scope item 2, pure functions only.
- `narrative-composer.service.ts` (+ `.spec.ts`) — Scope item 3.
- `morning-brief.service.ts` (+ `.spec.ts`) — Scope item 4.
- `morning-brief.controller.ts` — Scope item 5.
- `morning-brief.module.ts` — Scope item 6.

`apps/api/src/dashboard/dashboard.module.ts` — add `DashboardService` to
`exports` (Scope item 6's own prerequisite).

---

# Work Package 1 — Types + pure narrative template functions (Scope items 1, 2)

- **Deliverables:** `MorningBriefResponse`/`MorningBriefEntry`;
  `composeMorningBrief(decisionCenter): MorningBriefResponse` and its
  constituent pure helpers (story/why/confidence/uncertainty/headline/
  no-trade-narrative builders).
- **Acceptance Criteria:** every generated sentence is built only from
  fields already present on `DecisionCenterResponse`/`InstrumentReading`/
  `ContributingProviderView` — no new field is invented, no numeric value
  is computed that does not already exist upstream; `NO_CLEAR_OPPORTUNITY`
  and `DEGRADED` produce distinct, non-interchangeable narratives;
  entries bounded to `MAX_MORNING_BRIEF_ENTRIES` (Missing Decision 1).
- **Verification Steps:** table-driven unit tests asserting exact output
  strings for fixed fixture inputs across every readiness/participation/
  disagreement combination.
- **Risks:** accidentally overstating certainty in template wording
  (e.g. "will" instead of "shows evidence of") — mitigated by explicit
  wording review against `27_ZENITH_EXPERIENCE_LANGUAGE.md` §8.
- **Completion Criteria:** 100% of template branches covered by a
  deterministic assertion.

# Work Package 2 — Services, Controller, Module (Scope items 3-6)

- **Deliverables:** `NarrativeComposerService` (thin wrapper),
  `MorningBriefService` (calls `DashboardService.getDecisionCenter()`
  once, passes result to the composer, no independent aggregation),
  `MorningBriefController` (`GET /morning-brief`, JWT-guarded, mirroring
  `DashboardController`), `MorningBriefModule` (imports `DashboardModule`),
  `DashboardModule` exports `DashboardService` additively.
- **Acceptance Criteria:** `MorningBriefService` contains zero
  instrument-gathering or ranking logic of its own.
- **Verification Steps:** unit test asserting `DashboardService.getDecisionCenter`
  is called exactly once and its exact return value reaches the composer
  unmodified.
- **Completion Criteria:** endpoint reachable, authenticated, delegates
  correctly.

# Work Package 3 — Comprehensive tests (Scope item 7)

- **Deliverables:** full coverage per Work Packages 1-2's own criteria.
- **Completion Criteria:** `pnpm test`/workspace test green, no untested branch.

# Work Package 4 — Full build/lint/test/turbo verification

- **Deliverables:** clean `turbo build`/`lint`/`test` across the monorepo;
  live end-to-end verification against a booted API instance.
- **Completion Criteria:** zero regressions in any existing test.

# Work Package 5 — Sprint audit, Decision Log, Completion Report, docs, commit/push

- **Deliverables:** adversarial review specifically for fabrication/
  overstatement risk in generated text; Decision Log entry (Missing
  Decisions 1-3); `S1-020_COMPLETION_REPORT.md`; Project Brain/Roadmap/
  AI Index updates; commit and push.

---

# Related Documents

- `documentation/zos/sprints/S1-020_SPRINT_BRIEF.md`
- `documentation/zos/sprints/S1-019_SPRINT_BRIEF.md`
- `documentation/zos/11_DECISION_LOG.md`
