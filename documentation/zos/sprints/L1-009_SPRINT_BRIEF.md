# L1-009 SPRINT BRIEF — Live Data Acceptance Review

**Document ID:** ZOS-L1-009
**Version:** 1.0
**Status:** Proposed
**Owner:** Architecture Team
**Template Reference:** SPRINT_BRIEF_TEMPLATE.md (ZOS-SBT)

---

# Sprint Identification

- **Sprint ID:** L1-009
- **Sprint Name:** Live Data Acceptance Review
- **Milestone:** M3 — Live Data Platform (`08_ROADMAP.md`)
- **Phase:** Phase 9 of `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028) §9 Implementation Roadmap — the final row
- **Date Drafted:** 2026-07-17
- **Approved By:** *(pending — Status: Proposed)*
- **Baseline Sprints:** L1-001 through L1-008 — all Architecture-Team-approved and merged to `main`.

---

# Objectives

This Sprint is explicitly **an Acceptance Sprint, not a feature Sprint.** Its
objective is to validate and formally close Milestone M3, per the
Blueprint's own §9 Phase 9 row: *"Repeat the Foundation's acceptance-review
process (architecture, error handling, security, cost) before declaring
Live Data production-ready."* No new provider, no new domain, and no new
architecture is introduced. Concretely:

1. Conduct an evidence-based review of all eight prior L1 Sprints against
   the sixteen objectives the Architecture Team specified: Provider
   abstraction consistency, DI consistency, Shared HTTP layer reuse,
   Retry strategy, Circuit breaker usage, Cache strategy, Sync pipeline,
   Database consistency, API consistency, Documentation consistency,
   Sprint consistency, Cross-reference integrity, Technical debt,
   Operational monitoring, Performance observations, Production readiness
   for M3.
2. Explicitly review (not necessarily change) the two Special Review
   Items the Architecture Team named:
   - Whether `TRACKED_MACRO_SERIES` (`apps/api/src/macro-data/tracked-macro-series.ts`)
     remaining a hardcoded reference set is still the correct decision, or
     whether a future database-backed migration would provide meaningful
     value.
   - Whether `LiveDataObservabilityService`'s current in-memory-only
     implementation remains appropriate at this project stage, or whether
     future persistence would be beneficial.
   In both cases, per the Architecture Team's own instruction: **do not
   change or implement anything unless a compelling, clearly justified
   architectural reason is found during review.**
3. Produce the Acceptance Review report in the exact format the
   Architecture Team specified (Executive Summary, Architecture Review,
   Live Data Review, Documentation Review, Technical Debt Review,
   Security Review, Testing Review, Production Readiness Assessment,
   Final Acceptance Recommendation, Files modified, Commit hash).
4. Perform a **hardening pass strictly limited to genuinely discovered
   defects** — per the Mandatory Rules governing this Sprint: *"Do NOT
   refactor working code unless a real defect is discovered."* If review
   finds no defect in a given area, no change is made there; this Sprint
   does not manufacture work.

---

# Scope

1. **Review only** — read every provider, factory, module, sync service,
   controller, and spec file introduced across L1-001–L1-008, plus every
   L1 Sprint Brief and every related Decision Log entry, against the
   sixteen named objectives. No code is written during this step.
2. **Hardening pass** — apply a fix **only** where review surfaces a
   genuine, concrete defect (a bug, a broken cross-reference, a missing
   Decision Log entry for already-merged work, a stale Roadmap status
   line, etc.), each individually disclosed in the final report's
   Technical Debt Review / Files modified sections. No speculative
   improvement, no refactor of code that already works as intended, no
   new abstraction.
3. **Special Review Item #1 (`TRACKED_MACRO_SERIES`)** — read the current
   implementation and L1-007's own Design Notes/Decision Log rationale
   (DEC-2026 entry pending backfill, see Missing Decision #2 below),
   compare against L1-004's identical CFTC contract-mapping-table
   precedent, and record an explicit verdict: keep as-is, or a
   database-backed migration is justified. **Do not implement either
   outcome beyond recording the verdict**, unless the verdict is "keep
   as-is" (which requires no code change) — a "migrate" verdict is
   recorded as a future recommendation only, not built in this Sprint,
   since building it would be new scope this Sprint's own Mandatory
   Rules forbid introducing unilaterally.
4. **Special Review Item #2 (`LiveDataObservabilityService`)** — read the
   current in-memory implementation (`apps/api/src/monitoring/live-data-observability.service.ts`)
   and record an explicit verdict on whether persistence is warranted at
   this project stage. Same constraint as Item #1: a "persist" verdict is
   recorded as a future recommendation only, not implemented in this
   Sprint.
5. **Documentation/cross-reference reconciliation**, if and only if
   review discovers a genuine gap — e.g., this Sprint's own drafting
   process already discovered that `11_DECISION_LOG.md` currently has no
   entry for L1-007 or L1-008 (the log's last entry is DEC-2026-031, for
   L1-006), and that `08_ROADMAP.md`'s M3 status paragraph still reads
   "six Sprints" and lists only L1-001 through L1-006. Backfilling these
   is documentation upkeep identical in kind to every prior Sprint's own
   Definition of Done, not a code refactor, and is therefore in scope for
   the hardening pass regardless of which Missing Decision resolutions
   are chosen below.
6. **Final Acceptance Recommendation** — an explicit go/no-go statement on
   whether Milestone M3 (Live Data Platform) is production-ready, per the
   Blueprint's own declared bar ("before declaring Live Data
   production-ready").

---

# Out of Scope

- **Any new provider, new domain, new Prisma model, or new external
  integration** — this Sprint reviews the eight domains already built
  (Market Data, Market Sessions, Calendar/News, COT, Instrument Metadata,
  Corporate Actions, Macro Context, Monitoring/Observability); it adds
  none.
- **The Zenith Intelligence Layer or any post-M3 milestone** — explicitly
  forbidden by the Architecture Team's own instruction to STOP after this
  Sprint's report and wait for approval before any new milestone begins.
- **Implementing either Special Review Item's "change" outcome** — both
  are review-and-recommend only in this Sprint, per the Architecture
  Team's explicit "do NOT implement unless compelling reason exists"
  constraint (see Scope items 3–4).
- **Re-investigating external provider connectivity** — the environment
  egress-policy block (`api.twelvedata.com`, `financialmodelingprep.com`,
  `finnhub.io`, `api.marketaux.com`, `publicreporting.cftc.gov`,
  `api.stlouisfed.org`) is an established, documented constraint per the
  Architecture Team's standing instruction; this Sprint references it,
  never re-tests it as if novel.
- **Refactoring any working code absent a real discovered defect** — per
  the Mandatory Rules governing this Sprint.

---

# Dependencies

- **All of Phases 0–8** (L1-001 through L1-008), per the Blueprint's own
  Roadmap row ("Dependencies: Phases 0–8"), all Architecture-Team-approved
  and merged to `main`.
- **Resolution of the Missing Decisions below** — specifically, whether
  the `v1.0-live-data` git tag is created (and pushed) as part of this
  Sprint's own closure, and how the two Decision Log backfill entries
  (L1-007, L1-008) should be dated/attributed.

---

# Acceptance Criteria

1. All sixteen named review objectives are addressed with concrete,
   evidence-based findings (grep/read results, not assumption) — not a
   generic pass/fail without support.
2. Both Special Review Items receive an explicit, justified verdict; no
   code changes are made for either unless a compelling reason is found
   and explicitly recorded as such.
3. Any hardening-pass change is traceable to a specifically named,
   concretely described defect — no change appears without a stated
   reason.
4. Full existing test suite continues to pass with zero regressions after
   any hardening-pass change.
5. The final report follows the Architecture Team's exact required
   structure and section order.
6. Milestone M3's Roadmap status and Decision Log are left internally
   consistent with the actual state of `main` after this Sprint closes.

---

# Definition of Done

- Missing Decisions below explicitly resolved by the Architecture Team
  before the Acceptance Review itself is produced.
- Review conducted and hardening pass (if any) applied, committed, and
  pushed.
- Sprint Brief updated with Implementation Notes recording the review's
  findings summary and the hardening pass performed (if any).
- Final Acceptance Review report delivered in the Architecture Team's
  exact required format, then this Sprint (and Milestone M3) formally
  closed pending Architecture Team sign-off.

---

# Risks

1. **Scope creep disguised as "hardening"** — the single largest risk to
   an Acceptance Sprint is treating every stylistic preference as a
   "defect." Mitigated by the Mandatory Rules' own explicit bar ("a real
   defect is discovered") and by naming, in this Brief itself, the two
   concrete defects already known at draft time (missing L1-007/L1-008
   Decision Log entries; stale Roadmap M3 status text) so the hardening
   pass has a disclosed, bounded starting point rather than an
   open-ended audit.
2. **The `v1.0-live-data` tag is a visible, shared-state action** (once
   pushed, a remote tag is visible to anyone with repository access) —
   unlike a commit to a feature branch, it is not easily reversed without
   an explicit force-delete. This session's standing practice does not
   assume authorization for visible/shared actions beyond what is
   explicitly granted; see Missing Decision #1.
3. **Special Review Item verdicts could be read as licensing immediate
   implementation** if a "compelling reason" is found. Mitigated by Scope
   items 3–4 above: any "change is justified" verdict is recorded as a
   future recommendation only, not built in this Sprint, consistent with
   the Architecture Team's own "do NOT implement unless..." phrasing.
4. **Live external verification remains blocked** for the same
   environment-constraint reason documented since L1-001 — this Sprint's
   review references that constraint's cumulative history rather than
   re-testing it.

---

# Missing Decisions

1. **Whether to create (and push) the `v1.0-live-data` git tag as part of
   this Sprint's closure.** The Blueprint's own Phase 9 row names three
   deliverables — "Review report, hardening pass, `v1.0-live-data` tag" —
   but the Architecture Team's own kickoff message for this Sprint
   specifies only a report-style Output (Executive Summary through
   Commit hash) and does not mention a tag. A directly relevant
   precedent exists: `v1.0-foundation` (annotated tag, message "Zenith
   Foundation v1.0 - Approved production baseline before Live Data
   integration") was created and pushed to `origin` at the close of the
   Foundation milestone, immediately before the Live Data Blueprint's own
   work began — establishing that this project does mark milestone
   closure with a pushed, visible tag. Two options:
   - (a) **Create and push `v1.0-live-data`** at the same commit this
     Sprint's work is merged to `main`, mirroring the `v1.0-foundation`
     precedent exactly, once the Final Acceptance Recommendation is
     "production-ready."
   - (b) **Defer tag creation** to a separate, explicit Architecture Team
     instruction after this Sprint's report is reviewed — since a pushed
     tag is a visible, shared-state action this Sprint's kickoff message
     does not explicitly request, and the standing session practice is
     to never assume such actions beyond explicit authorization.
   - **This Brief does not assume an answer.** The Architecture Team must
     specify which applies before the tag (if any) is created.

2. **How to backfill the missing L1-007 and L1-008 Decision Log entries**
   (`DEC-2026-032`, `DEC-2026-033`) discovered during this Brief's own
   drafting — `11_DECISION_LOG.md`'s last entry is `DEC-2026-031`
   (L1-006), with no entry for either already-merged L1-007 or L1-008.
   This mirrors the exact gap the Documentation Reconciliation Checkpoint
   closed for L1-001–L1-006. Two options:
   - (a) **Backfill both now, as part of this Sprint's hardening pass**,
     dated to this Sprint's own drafting date, following the exact
     Decision Log template/style used for `DEC-2026-026` through `031`.
   - (b) **Treat this as strictly out of this Sprint's scope**, on the
     theory that an Acceptance Sprint should review, not correct, prior
     Sprints' own documentation debt, and instead simply name the gap as
     a finding in the Documentation Review / Technical Debt Review
     sections of the final report, deferred to a future dedicated
     reconciliation checkpoint (mirroring the one already run once in
     this Milestone).
   - **This Brief recommends (a)**, since the fix is small, mechanical,
     evidence-based, and directly analogous to work the Architecture
     Team already approved once this Milestone — but does not assume it,
     since the Architecture Team's own Mandatory Rules for this Sprint
     emphasize minimal, tightly-scoped action.

---

# Verification Plan

1. **Evidence gathering**: grep/read every provider, factory, module,
   sync service, HTTP client usage, and spec file across all eight L1
   domains; cross-reference each against its own Sprint Brief and
   Decision Log entry. No assumption is treated as a finding without a
   direct code citation.
2. **Regression check**: if any hardening-pass change is made, the full
   existing `apps/api`/`packages/database` test suite must continue to
   pass with zero failures (`turbo run build lint test`).
3. **Live-boot verification**: boot the API in Simulated mode (zero
   regression across all Live Data endpoints) — reusing the same
   empirical row-count/MD5-hash-comparison technique established since
   L1-006, but only if a hardening-pass change touches runtime code; a
   documentation-only hardening pass does not require a reboot.
4. **No new live-provider connectivity test** — the environment
   egress-policy constraint is referenced from its established history
   (L1-001 through L1-007), not re-attempted, per the Architecture Team's
   explicit instruction for this Sprint.
5. **Cross-reference integrity check**: confirm every Sprint Brief's own
   "Related Documents" section and the Blueprint's own §9 Roadmap table
   accurately reflect the final, merged state of `main` as of this
   Sprint's close.

---

# Design Notes (disclosed, bounded implementation choices — not escalated)

- **Report delivery form**: the Acceptance Review report is delivered
  both as this session's chat response (in the Architecture Team's exact
  requested section order) and captured permanently in this Brief's own
  Implementation Notes section, mirroring every prior L1 Sprint's
  practice of recording implementation results directly in the Sprint
  Brief.
- **Hardening-pass authority**: the Mandatory Rules governing this Sprint
  ("Do NOT refactor working code unless a real defect is discovered")
  already grant authority to fix a genuinely discovered defect within
  this same Sprint/commit, without a separate per-defect escalation —
  consistent with every prior Sprint's Definition of Done requiring a
  zero-regression, fully-closed Sprint. This is treated as resolved by
  the Architecture Team's own kickoff message, not re-escalated here.
- **Special Review Item verdicts that conclude "change is justified"**
  are recorded as a named recommendation for a future, separate Sprint
  Brief — never implemented inline in this Sprint — consistent with the
  Architecture Team's own "do NOT implement... unless a compelling
  reason exists" phrasing, read together with this Sprint's Mandatory
  Rule against scope expansion.

---

# Blueprint Traceability

- **Blueprint Reference (Phase(s)):** Phase 9 — "Live Data Acceptance
  Review" (`28_LIVE_DATA_BLUEPRINT.md`, ZOS-028, §9 Implementation
  Roadmap) — the final row of the Milestone M3 roadmap.
- **Referenced Section(s):** §9 (Implementation Roadmap, Phase 9 row —
  "Repeat the Foundation's acceptance-review process... Review report,
  hardening pass, `v1.0-live-data` tag").
- **Next Blueprint Phase:** None — Phase 9 is the final phase of
  `28_LIVE_DATA_BLUEPRINT.md`'s own roadmap. Any subsequent work belongs
  to a future milestone (e.g., the Zenith Intelligence Layer), explicitly
  out of scope for this Sprint and requiring its own separate
  Architecture Team authorization.

---

# Approval Status

- [x] Proposed
- [ ] Under Review
- [x] Approved
- [ ] Rejected

**Final Status:** Approved — Accepted. Milestone M3 (Live Data Platform) formally closed.

---

# Implementation Notes

**Date Implemented:** 2026-07-17
**Approved By:** Architecture Team

## Resolution of Missing Decisions

- **Missing Decision #1 (release tag):** Approved conditionally — create and push `v1.0-live-data` only if the Acceptance Review concludes "Accepted," following the `v1.0-foundation` precedent. The review below concludes Accepted with no blocking defects, so the tag was created and pushed.
- **Missing Decision #2 (Decision Log backfill):** Approved — backfill `DEC-2026-032` (L1-007) and `DEC-2026-033` (L1-008) using the established template; no additional entries.

## Review Summary

A full evidence-based review was conducted across all sixteen named objectives (grep/read of every provider, factory, module, sync service, controller, and spec file across all eight Live Data domains — Market Data, Market Sessions, Calendar/News, COT, Instrument Metadata, Corporate Actions, Macro Context, Monitoring/Observability). Findings:

- **Provider abstraction / DI / HTTP reuse / retry / circuit breaker**: fully consistent. Every live provider instantiates the shared `MarketDataHttpClient` (single implementation, reused nine times across six domains); `withRetry`/`ProviderCircuitBreaker` exist in exactly one place each and are never duplicated; every provider token follows the `interface + string token + Simulated fallback + factory` shape.
- **Cache strategy / sync pipeline**: each domain declares its own disclosed freshness-window constant matching that data's real-world publication cadence (quotes 15s, calendar/news 24h, corporate actions 24h, macro 24h, COT 7d) and a consistent `ensureCached`-then-upsert pattern; cron cadences (5 min / daily / 30 min / weekly / daily / daily) match Blueprint §6/§9 exactly. Every `*SyncService` reuses `MarketDataSyncService.getTrackedAssetIds()` except `MacroDataSyncService`, a disclosed, architecturally justified exception (macro series have no Asset/Watchlist scope).
- **Database consistency**: every new model has a real compound `@@unique` natural key and `onDelete: Cascade`; `Decimal @db.Decimal(24,8)` used uniformly for monetary/numeric fields.
- **API consistency**: all six controllers use the identical `@ApiTags` + `@ApiBearerAuth` + `@UseGuards(JwtAuthGuard)` + `@Controller` shape.
- **Documentation / Sprint / cross-reference consistency**: two gaps found and corrected in this Sprint's hardening pass (see below); no other broken cross-references found across Sprint Briefs, Blueprint, or Roadmap.
- **Technical debt** (disclosed, none requiring a code change): (1) `MarketDataHttpClient`-consuming factory functions have inconsistent parameter ordering between `createMarketDataProvider(apiKey, mode, ...)` and `createMacroDataProvider`/`createCorporateActionsProvider(mode, apiKey, ...)` — cosmetic only, each call site is internally consistent and type-checked; not fixed, since doing so would touch already-working, already-tested call sites for zero functional benefit. (2) The CFTC Socrata resource ID and FRED/Finnhub/TwelveData/MarketAux integrations remain unverified against live traffic due to the standing environment egress-policy constraint (see Risks). (3) `cot-sync.service.spec.ts` was missing (every sibling `*SyncService` had one) — a genuine test-coverage gap, fixed in this Sprint's hardening pass (see below).
- **Operational monitoring**: `LiveDataObservabilityService` correctly receives circuit-state/success/failure/retry events from all nine `MarketDataHttpClient` instances and `recordSync()` calls from all six `*SyncService`s (confirmed by reading each call site); `GET /monitoring/provider-health` and `GET /monitoring/alerts` verified live in Simulated mode.
- **Performance observations**: no N+1 query pattern found in any sync service (each iterates a bounded tracked-asset or tracked-series set, one upsert per item); no unbounded fan-out; HTTP timeouts (10s) and circuit breakers bound worst-case latency per provider.
- **Security review**: `.env` is git-ignored and has never been committed; `.env.example` ships only empty placeholder values; every live provider defaults to Simulated unless both an explicit `*_MODE=live` and a real credential are present, logging a clear warning otherwise; every new endpoint requires `JwtAuthGuard`; no endpoint exposes credentials or raw provider responses.
- **Testing review**: full regression suite — **174 test suites, 913 tests, all passing, zero regressions** (up from 171/881 at L1-007 close).

## Special Review Item Verdicts

1. **`TRACKED_MACRO_SERIES` hardcoding**: **Keep as-is.** It mirrors the already-accepted `CFTC_CONTRACT_MAPPING` (L1-004) precedent exactly — a small, disclosed, extensible reference set, not an exhaustive catalog. Extending it is a one-line, low-risk code change; nothing in the Blueprint or any Sprint Brief calls for runtime/admin configurability of tracked series; a database-backed migration would add a migration, a CRUD/admin surface, and operational complexity with no current requirement driving it. No compelling architectural reason to migrate was found. No code changed.
2. **`LiveDataObservabilityService` in-memory-only implementation**: **Keep as-is.** This is a direct, disclosed consequence of Architecture Team Decision 2 (Passive Health Monitoring only) and Decision 3's own bounded field list (success/failure count, latency, retry, rate-limit events, last success/failure/sync) — none of which implies cross-restart durability. The platform runs as a single API instance today; persisting every provider call to the database would add write amplification with no current consumer needing historical trend data beyond the current snapshot. If Zenith later moves to a multi-instance deployment, in-memory state would no longer be shared/consistent across instances — a real, already-implicit limitation of "in-memory only," not a new finding, and a legitimate trigger for revisiting this decision in a future Sprint. No compelling reason to implement persistence now. No code changed.

## Hardening Pass (defects found and fixed)

1. **Missing `DEC-2026-032`/`DEC-2026-033` Decision Log entries** for L1-007/L1-008 (log's last entry was `DEC-2026-031`) — backfilled in `11_DECISION_LOG.md` using the established template.
2. **`08_ROADMAP.md`'s M3 status stale** (listed only six Sprints, "70%") — updated to reflect all nine Sprints and 100% completion.
3. **Missing `cot-sync.service.spec.ts`** (the only `*SyncService` without a spec file, inconsistent with all five siblings) — added, mirroring `corporate-actions-sync.service.spec.ts` exactly (3 tests: `recordSync` domain assertion, `getTrackedAssetIds()` reuse assertion, partial-failure tolerance assertion).

No other code was changed. No refactor was performed absent these three concretely identified gaps.

## Files Changed

- `documentation/zos/11_DECISION_LOG.md` (+2 entries: `DEC-2026-032`, `DEC-2026-033`)
- `documentation/zos/08_ROADMAP.md` (M3 status synced to reflect L1-007–L1-009 and 100% completion)
- `apps/api/src/cot/cot-sync.service.spec.ts` (new — closes test-coverage gap)
- `documentation/zos/sprints/L1-009_SPRINT_BRIEF.md` (this file — Implementation Notes)

## Live Verification Summary

- Booted the API against real local PostgreSQL in default (Simulated) mode: all routes across all eight Live Data domains registered cleanly, including `GET /monitoring/provider-health`, `GET /monitoring/alerts`, `GET /macro-data`, `GET /market-data/provider-health` (pre-existing, confirmed byte-for-byte behaviorally unchanged).
- No new external provider was introduced by this Sprint, so no new live-connectivity attempt applies. The environment egress-policy constraint affecting `api.twelvedata.com`, `financialmodelingprep.com`, `finnhub.io`, `api.marketaux.com`, `publicreporting.cftc.gov`, and `api.stlouisfed.org` remains the standing, documented limitation carried forward from L1-001 through L1-007 — referenced, not re-investigated, per the Architecture Team's explicit instruction for this Sprint.

**Sprint Status:** Approved — Accepted. Milestone M3 formally closed; `v1.0-live-data` tag created and pushed.

---

# Related Documents

- `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028)
- `documentation/zos/sprints/L1-001_SPRINT_BRIEF.md` through `L1-008_SPRINT_BRIEF.md`
- `05_ARCHITECTURE.md`
- `04_TECH_STACK.md`
- `14_DEPENDENCY_POLICY.md`
- `08_ROADMAP.md`
- `11_DECISION_LOG.md`
- `09_PROJECT_BRAIN.md`
- `12_ADR_INDEX.md` (ADR-003, ADR-004)
