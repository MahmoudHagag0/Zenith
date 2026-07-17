# L1-006 SPRINT BRIEF — Corporate Actions (Splits & Dividends)

**Document ID:** ZOS-L1-006
**Version:** 1.1
**Status:** Approved — Live External Verification Pending (Environment Constraint)
**Owner:** Architecture Team
**Template Reference:** SPRINT_BRIEF_TEMPLATE.md (ZOS-SBT)

---

# Sprint Identification

- **Sprint ID:** L1-006
- **Sprint Name:** Corporate Actions (Splits & Dividends)
- **Milestone:** M3 — Live Data Platform (`08_ROADMAP.md`)
- **Phase:** Phase 6 of `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028) §9 Implementation Roadmap
- **Date Drafted:** 2026-07-16
- **Approved By:** *(pending — Status: Proposed)*
- **Baseline Sprints:** L1-001 through L1-005 — all Architecture-Team-approved and merged to `main`.

---

# Objectives

1. Introduce a new `CorporateActionsProvider` interface — per Blueprint §4.1, this domain has **no existing provider abstraction** (listed alongside `InstrumentMetadataProvider`, `MarketSessionProvider`, `MacroDataProvider`), following the same new-interface precedent as L1-002/L1-005.
2. Source split and dividend data from Twelve Data (primary) per Blueprint §3, with Finnhub available as a secondary source — subject to Missing Decision #3 below, following the established pattern of not assuming a dual-source scope.
3. Resolve, not assume, **how** corporate actions actually integrate with the existing, real-money-accounting `Position`/`Transaction` model (S1-004) and existing `Candle` (OHLC) data (S1-005/L1-001) — the Blueprint itself rates this Phase "Medium–High (correctness-critical)" and its own stated Key Risk is "wrong adjustment silently corrupts P/L history." This Brief treats that risk as reason to escalate the integration design to the Architecture Team, not to assume an approach.

This Sprint is unlike every prior L1 Sprint: L1-001 through L1-005 all added **new, additive, read-only** data domains with no interaction with existing financial calculations. Corporate Actions is the first Phase that requires **modifying the meaning of existing stored financial data** (historical `Candle` rows, `Position.averageCost`) — a materially higher-risk category of change.

---

# Scope

*(Deliberately narrow pending Missing Decision resolution — see below.)*

1. `CorporateActionsProvider` interface (new), proposed shape for Architecture Team confirmation:
   ```
   interface CorporateActionsProvider {
     readonly name: string;
     getSplits(symbol: string, since: Date): Promise<ProviderSplitEvent[]>;
     getDividends(symbol: string, since: Date): Promise<ProviderDividendEvent[]>;
   }
   ```
   plus a `SimulatedCorporateActionsProvider`, matching every prior Sprint's Simulated-implementation-first precedent.
2. Zod raw-schema validation + `normalize()` mapping for the resolved provider's split/dividend endpoints.
3. A `createCorporateActionsProvider()` factory mirroring every prior Sprint's factory pattern.
4. Whatever `Candle`/`Position` adjustment mechanism is actually approved (Missing Decision #1) — **not specified further here**, since its shape depends entirely on that resolution.
5. Unit tests (normalization, factory fallback) and integration tests using mocked transport.

---

# Out of Scope

- **Any actual mutation of `Candle` or `Position`/`Transaction` data** until Missing Decision #1 is resolved — this Brief does not authorize touching existing financial data.
- **Cash-dividend income tracking as a new Portfolio concept** — the existing `Portfolio`/`Position` model has no cash-balance concept at all (S1-004); introducing one is a separate, larger question than this Phase's stated goal of "adjusted historical data; correct Portfolio math," and is explicitly deferred pending Missing Decision #2.
- **The Data Quality Layer, Confidence Engine, cross-provider scoring, or provider trust ranking** — per the Architecture Team's L1-003 decision, deferred platform-wide.
- **Macro Context, Monitoring/Observability, Live Data Acceptance Review** (Phases 7–9).
- **Modifications to `InstrumentMetadataProvider`, `MarketSessionProvider`, `CalendarNewsProvider`, `CotProvider`, or any prior L1 Sprint's deliverable** — reused as-is.
- **L1-007 or any later Sprint.**

---

# Dependencies

- **Phases 1 and 5** — per the Blueprint's own Roadmap, satisfied by L1-001 (Live Market Data) and L1-005 (Instrument Metadata).
- **Resolution of Missing Decisions #1–#3 below** — this Sprint cannot be scoped precisely, let alone implemented, until they are resolved. Unlike L1-004 (no open questions), this Sprint is the highest-risk Phase to date and requires explicit sign-off on the accounting-integration approach before any code is written.
- **Existing `PositionsService`, `Transaction`/`Position` Prisma models (S1-004), `MarketDataService`/`Candle` (S1-005/L1-001)** — referenced, not assumed changed.

---

# Acceptance Criteria

*(Provisional — final criteria depend on Missing Decision resolutions.)*

1. `CorporateActionsProvider` is registered via DI exactly like every other Live Data domain.
2. Whatever adjustment mechanism is approved, it must be provably correct against at least one real, known historical stock split (the Blueprint's own stated requirement: "needs dedicated tests against known historical splits").
3. No existing `Position.averageCost`/`realizedPnl` or `Transaction` row is silently altered without an auditable, disclosed mechanism for how and why.
4. No new npm dependency introduced unless proven strictly necessary, flagged for `14_DEPENDENCY_POLICY.md` review if so.
5. Full existing test suite continues to pass with zero regressions.

---

# Definition of Done

- Missing Decisions #1–#3 below explicitly resolved by the Architecture Team before implementation begins.
- Deliverables (to be finalized once resolved) complete and merged.
- Dedicated correctness tests against at least one real historical split pass, per the Blueprint's own stated requirement.
- Sprint Brief updated with Implementation Notes and a live-verification result, following the now-established pattern.

---

# Risks

1. **Silent P/L corruption** — the Blueprint's own stated Key Risk: an incorrect split/dividend adjustment could silently corrupt historical OHLC and Portfolio average-cost with no visible error. This is the highest-consequence risk of any L1 Sprint to date.
2. **Retroactive data mutation risk** — if the approved approach (Missing Decision #1) involves adjusting already-stored `Candle`/`Position` values in place, a bug affects historical correctness invisibly, unlike a live-quote bug which is immediately visible and self-correcting on the next poll.
3. **Scope creep into Portfolio cash accounting** — dividends naturally raise the question of cash income, which the existing Portfolio model does not track at all; Missing Decision #2 exists specifically to prevent this Sprint from silently expanding into that separate, larger concern.
4. **Live verification may be blocked by this session's environment egress policy**, consistent with the now-established pattern (Twelve Data, FMP, Finnhub, MarketAux, CFTC) — expected to recur, not re-investigated as a novel finding per the Architecture Team's standing instruction.

---

# Missing Decisions

1. **How corporate action adjustments are actually applied to existing financial data.** Two materially different architectures both satisfy the Blueprint's stated goal ("adjusted historical data; correct Portfolio math"):
   - (a) **Mutate-in-place**: retroactively rewrite existing `Candle` OHLC rows and `Position.averageCost`/`quantity` when a split/dividend is detected.
   - (b) **Compute-on-read**: store corporate action events in a new table only, and apply the adjustment factor at query time (Analysis Engine reads, Portfolio valuation reads) without ever altering the originally stored `Candle`/`Transaction` rows.
   These have very different risk, auditability, and rollback profiles — (a) risks silent, hard-to-detect corruption if wrong; (b) is safer to reason about and reverse but is a more significant read-path change across Analysis Engine and Portfolio/Positions. **This Brief does not assume an answer.** The Architecture Team must specify which approach this Sprint implements.
2. **Whether dividends require introducing cash-balance tracking into the Portfolio model at all.** The existing `Portfolio`/`Position` schema (S1-004) has no cash-balance concept — only `quantity`/`averageCost`/`realizedPnl` per position. A cash dividend has no natural home in that model today. **This Brief does not assume an answer.** The Architecture Team must specify whether this Sprint (a) handles dividends only as an OHLC-continuity adjustment (no Portfolio-side change at all), or (b) requires introducing a new cash-tracking concept to Portfolio — a substantially larger scope than "adjusted historical data."
3. **Twelve Data vs. Finnhub role for this domain.** Blueprint §3 lists "Twelve Data | Finnhub" for Corporate Actions with the stated rationale "both vendors already integrated for market data — no new vendor relationship required," which reads more permissively toward dual-source than L1-005's Instrument Metadata framing, but still does not explicitly mandate both from day one. **This Brief does not assume an answer**, consistent with every prior Sprint's treatment of this exact class of question.

---

# Verification Plan

*(Forward-looking, and provisional pending Missing Decision resolution.)*

1. **Unit tests**: provider normalization, factory fallback — no live network required.
2. **Correctness tests against real historical splits**: the Blueprint's own explicit requirement — e.g., verify a known real-world stock split correctly adjusts whatever data the approved mechanism (Missing Decision #1) touches, with hand-computed expected values.
3. **Regression check**: full existing `apps/api` test suite must continue to pass with zero failures, with particular attention to `PositionsService`/`MarketDataService` given this Phase's direct interaction with existing financial data.
4. **Live verification**: a real request to the resolved provider's corporate-actions endpoint(s), subject to this session's environment network-egress policy.
5. **Manual/observational check**: confirm no existing `Position`/`Transaction`/`Candle` row is altered except through the explicitly approved, auditable mechanism.

---

# Blueprint Traceability

- **Blueprint Reference (Phase(s)):** Phase 6 — "Corporate Actions" (`28_LIVE_DATA_BLUEPRINT.md`, ZOS-028, §9 Implementation Roadmap).
- **Referenced Section(s):** §1 Additional Domains (Corporate Actions row), §3 (Provider Comparison Matrix — Corporate Actions row), §4.1 (Provider Abstraction — `CorporateActionsProvider` NEW), §9 (Implementation Roadmap, Phase 6 row), Addendum §A2 (Provider Priority Matrix — Corporate Actions row), Addendum §A3 (SLA & Freshness Matrix — Corporate Actions row).
- **Next Blueprint Phase:** Phase 7 — Macro Context (FRED).

---

# Approval Status

- [x] Proposed
- [ ] Under Review
- [x] Approved
- [ ] Rejected

**Final Status:** Approved — Live External Verification Pending (Environment Constraint)

---

# Implementation Notes

**Date Implemented:** 2026-07-17
**Approved By:** Architecture Team

## Resolution of Missing Decisions

1. **Adjustment mechanism (Missing Decision #1) — resolved as compute-on-read.** Corporate Actions are stored exclusively in a new, independent `CorporateAction` table (`assetId`, `type`, `effectiveDate`, `ratio`/`amount`+`currency`, `provider`, `providerEventId`, `retrievedAt`, `rawPayload`). This Sprint never reads or writes `Candle`, `Position`, or `Transaction` — no mutate-in-place logic of any kind was implemented. Any future adjustment consumer (Analysis Engine, Portfolio valuation) must compute the adjustment on read from this table; that consumer is explicitly out of scope for L1-006.
2. **Portfolio cash / dividend accounting (Missing Decision #2) — resolved as out of scope.** No cash balance, wallet, or dividend-income concept was introduced anywhere in `Portfolio`/`Position`. Dividend events are recorded as raw `CorporateAction` rows (amount + currency) only, with no effect on any existing Portfolio calculation. This belongs to a future dedicated financial-accounting milestone per the Architecture Team's decision.
3. **Provider responsibility (Missing Decision #3) — resolved as Finnhub-only.** `FinnhubCorporateActionsProvider` is the sole live implementation, calling Finnhub's `/stock/split` and `/stock/dividend` endpoints exclusively. It does not call Twelve Data. Twelve Data's existing responsibility (Quotes, Candles, Instrument Metadata) is unchanged.

## Work Completed

- Added `CorporateActionType` enum (`SPLIT`, `DIVIDEND`) and `CorporateAction` Prisma model, with a real compound `@@unique([assetId, type, effectiveDate])` natural key (idempotency requirement) and `onDelete: Cascade` (non-authoritative cached domain, consistent with `NewsItem`/`CalendarEvent`/`CotReport`). Migration `20260717010830_add_corporate_action` applied.
- New `CorporateActionsProvider` interface (`ProviderSplitEvent`, `ProviderDividendEvent`) — a NEW abstraction per Blueprint §4.1, following the ADR-003 interface + token + Simulated-implementation pattern.
- `SimulatedCorporateActionsProvider` — returns no events for either method (disclosed: splits/dividends have no meaningful simulated equivalent, unlike quotes/news/COT).
- `FinnhubCorporateActionsProvider` — live implementation using two independent `MarketDataHttpClient` instances (`finnhub-splits`, `finnhub-dividends`, separate circuit breakers), Zod raw-schema validation, and `normalize()` mapping (`normalizeFinnhubSplit`/`normalizeFinnhubDividend`). `providerEventId` is left `undefined` since Finnhub supplies no distinct per-event identifier — an honest absence, not a fabricated one.
- `createCorporateActionsProvider()` factory — `CORPORATE_ACTIONS_MODE=live` + `FINNHUB_API_KEY` (reused as-is from L1-003, no duplicate credential introduced) selects the live provider; otherwise falls back to Simulated with a logged warning.
- `CorporateActionsService` — idempotent `upsert()` against the `(assetId, type, effectiveDate)` natural key, 24h cache-freshness window; reads/writes only the `CorporateAction` Prisma model.
- `CorporateActionsSyncService` — daily cron (`EVERY_DAY_AT_MIDNIGHT`, matching the Blueprint's stated "Daily" sync frequency for this domain), reusing `MarketDataSyncService.getTrackedAssetIds()`.
- `CorporateActionsController` — read-only `GET /corporate-actions/:assetId`, mirroring `CotController` exactly (`JwtAuthGuard`, Swagger tags).
- `CorporateActionsModule` — registered in `AppModule`; imports `DatabaseModule`, `AuthModule`, `AssetsModule`, `MarketDataModule`, mirroring `CotModule`'s import list.
- `CORPORATE_ACTIONS_MODE` added to `apps/api/.env` and `.env.example`.

## Files Changed

- `packages/database/prisma/schema.prisma` (+ generated migration `20260717010830_add_corporate_action`)
- `apps/api/src/corporate-actions/providers/corporate-actions-provider.interface.ts` (new)
- `apps/api/src/corporate-actions/providers/simulated-corporate-actions.provider.ts` (new)
- `apps/api/src/corporate-actions/providers/corporate-actions.schemas.ts` (new)
- `apps/api/src/corporate-actions/providers/corporate-actions.normalize.ts` (new)
- `apps/api/src/corporate-actions/providers/finnhub-corporate-actions.provider.ts` (new)
- `apps/api/src/corporate-actions/providers/corporate-actions-provider.factory.ts` (new)
- `apps/api/src/corporate-actions/corporate-actions.service.ts` (new)
- `apps/api/src/corporate-actions/corporate-actions-sync.service.ts` (new)
- `apps/api/src/corporate-actions/corporate-actions.controller.ts` (new)
- `apps/api/src/corporate-actions/corporate-actions.module.ts` (new)
- `apps/api/src/app.module.ts` (registered `CorporateActionsModule`)
- `apps/api/.env`, `apps/api/.env.example` (added `CORPORATE_ACTIONS_MODE`)
- Test spec files: `corporate-actions.normalize.spec.ts`, `corporate-actions-provider.factory.spec.ts`, `finnhub-corporate-actions.provider.spec.ts`, `corporate-actions.service.spec.ts`, `corporate-actions-sync.service.spec.ts`

## Test Summary

- 23 new tests across 5 new spec files, all passing: normalize mapping (ratio computation, reverse splits, unparseable dates, missing currency default), factory fallback (simulated/live/missing-credential warning), live Finnhub provider (URL construction, normalization, filtering unparseable events), service idempotency (repeated upsert against the same natural key produces no duplicate, and touches only the `corporateAction` Prisma model), and sync-service batch tolerance.
- Full regression suite: `turbo run build lint test` for `@zenith/api`/`@zenith/database` — **166 test suites, 860 tests, all passing, zero regressions.**

## Live Verification Summary

- Booted the API against real local PostgreSQL in `CORPORATE_ACTIONS_MODE=simulated` (default): `CorporateActionsController` routes registered cleanly, `GET /corporate-actions/:assetId` returned `[]` as expected for the Simulated provider.
- Captured `Candle`/`Position` row-count and `md5` ID-set hashes before and after exercising the new endpoint: **identical in both counts and hashes** — empirically confirms Decision 1 (Corporate Actions never mutates existing financial data), not just by code review.
- Booted with `CORPORATE_ACTIONS_MODE=live` and `FINNHUB_API_KEY` unset: confirmed the exact expected fallback warning log (`CORPORATE_ACTIONS_MODE=live but FINNHUB_API_KEY is not set — falling back to SimulatedCorporateActionsProvider`) and correct fallback behavior.
- Attempted a real connectivity check against `finnhub.io`'s corporate-actions endpoints: blocked by this session's environment egress policy (`403`/`CONNECT tunnel failed`), consistent with the same host's finding in L1-003. No workaround attempted, per standing instruction.

**Sprint Status:** Approved — Live External Verification Pending (Environment Constraint)

---

# Related Documents

- `28_LIVE_DATA_BLUEPRINT.md` (ZOS-028)
- `documentation/zos/sprints/L1-001_SPRINT_BRIEF.md` (ZOS-L1-001)
- `documentation/zos/sprints/L1-002_SPRINT_BRIEF.md` (ZOS-L1-002)
- `documentation/zos/sprints/L1-003_SPRINT_BRIEF.md` (ZOS-L1-003)
- `documentation/zos/sprints/L1-004_SPRINT_BRIEF.md` (ZOS-L1-004)
- `documentation/zos/sprints/L1-005_SPRINT_BRIEF.md` (ZOS-L1-005) — baseline Sprint
- `05_ARCHITECTURE.md`
- `04_TECH_STACK.md`
- `14_DEPENDENCY_POLICY.md`
- `08_ROADMAP.md`
- `11_DECISION_LOG.md`
- `09_PROJECT_BRAIN.md`
- `12_ADR_INDEX.md` (ADR-003, ADR-004)
