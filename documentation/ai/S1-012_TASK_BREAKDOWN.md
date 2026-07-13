# S1-012_TASK_BREAKDOWN

**Document ID:** AI-029
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team (via Implementation Engineer)

------------------------------------------------------------------------

# Purpose

Execution-guidance breakdown for the approved `S1-012_SPRINT_BRIEF.md` (Confluence Engine), based strictly on that Brief, ADR-006/007, and `22_ANALYSIS_ENGINE_ARCHITECTURE.md`. Every Work Package below maps directly to a numbered Scope item in the approved Brief; none introduces content beyond it. Per the Architecture Team's autonomous-execution authorization for this sprint, this Task Breakdown is self-audited and approved concurrently with the Sprint Brief — no separate approval gate — and Work Packages proceed directly to implementation.

# Proposed Module Layout

- `apps/api/src/analysis-engine/providers/normalized-vocabulary.types.ts` (new) — the shared vocabulary schema (Scope item 1): generic, imported by every Provider, not confined to `confluence/`.
- `apps/api/src/analysis-engine/providers/analysis-provider.types.ts` (modified) — `normalize()`'s completed signature (Scope item 2).
- `apps/api/src/analysis-engine/providers/wyckoff/wyckoff-normalize.util.ts` + `wyckoff.provider.ts` (modified) — Wyckoff's own `normalize()` mapping (Scope item 3).
- `apps/api/src/analysis-engine/providers/ict-smc/ict-smc-normalize.util.ts` + `ict-smc.provider.ts` (modified) — ICT/SMC's own mapping.
- `apps/api/src/analysis-engine/providers/elliott-wave/elliott-wave-normalize.util.ts` + `elliott-wave.provider.ts` (modified) — Elliott Wave's own mapping.
- `apps/api/src/analysis-engine/providers/__fixtures__/fixture-provider.ts` (modified) — updated to the new `normalize()` signature (Scope item 2, mechanical).
- `apps/api/src/analysis-engine/providers/normalize-vocabulary-conformance.spec.ts` (new) — the shared conformance test suite (Scope item 4).
- `apps/api/src/analysis-engine/confluence/` (new) — `confluence.types.ts` (`ConfluenceWeightStrategy`, `ConfluenceResult`, `DimensionConfluence`, `ProviderParticipationSummary`, `ProviderReference`), `confluence.tokens.ts` (`CONFLUENCE_ENGINE`, `CONFLUENCE_WEIGHT_STRATEGY`), `equal-weight.strategy.ts` (Scope item 5), `confluence-family-grouping.util.ts` (Scope item 6), `confluence-dimension-aggregator.util.ts` (Scope item 7), `confluence.service.ts` (Scope items 8-9, orchestration), plus `*.spec.ts` per file and a golden-dataset/reference-scenario spec (Scope item 10).
- `apps/api/src/analysis-engine/analysis-engine.module.ts` (modified) — registers `CONFLUENCE_ENGINE`/`CONFLUENCE_WEIGHT_STRATEGY`.

---

# Work Packages

## WP1 — Normalized Vocabulary Schema and `normalize()` signature completion

**Maps to:** Scope items 1, 2; Architecture Requirements ("one authorized interface completion").

- **Deliverables:** `normalized-vocabulary.types.ts` defining `NormalizedDimension` (7-value union), `NormalizedReading` (`BULLISH`/`BEARISH`/`NEUTRAL`/`NOT_APPLICABLE`), `NormalizedSignal` (`dimension`, `reading`, `strength: number` 0-100, `explanation: string`), `NormalizedProviderOutput` (`providerId`, `methodologyFamily?`, `vocabularySchemaVersion`, `signals: readonly NormalizedSignal[]`, always length 7). `analysis-provider.types.ts`'s `AnalysisProvider.normalize()` changed from `(): void` to `(result: AnalysisProviderResult): NormalizedProviderOutput`.
- **Acceptance Criteria:** "`AnalysisProvider.normalize()` has signature `(result: AnalysisProviderResult) => NormalizedProviderOutput`... with zero change to any other interface member" (Brief, Acceptance Criteria).
- **Verification Steps:** Type-only compile check (no runtime test needed for a pure type change) plus a unit test constructing a `NormalizedProviderOutput` fixture and asserting the type shape via TypeScript at compile time; confirms no other `AnalysisProvider` member's type changed via a diff-style review of `analysis-provider.types.ts`.
- **Risks:** Brief Risk "Interface-change risk" — mitigated by this WP touching only `normalize()`'s signature line, nothing else in the file.
- **Completion Criteria:** New types file compiles; interface signature updated; no other contract member touched.

## WP2 — Update all four existing `normalize()` implementers to the new signature

**Maps to:** Scope item 2 (completion, mechanical half); Acceptance Criteria ("every current implementer... is updated to match").

- **Deliverables:** `FixtureProvider.normalize()` updated to return a minimal valid `NormalizedProviderOutput` (all 7 dimensions `NOT_APPLICABLE`, since the fixture carries no real methodology content, consistent with its existing "carries no methodology content" precedent). `analysis-provider.types.spec.ts` updated to assert the new return shape instead of `toBeUndefined()`. `WyckoffProvider`/`IctSmcProvider`/`ElliottWaveProvider`'s `normalize()` method bodies temporarily also updated to a minimal valid stub (real mappings follow in WP3-WP5) so the monorepo compiles at every intermediate step.
- **Acceptance Criteria:** Same line as WP1 — "every current implementer... is updated to match."
- **Verification Steps:** `pnpm --filter @zenith/api build` succeeds; `analysis-provider.types.spec.ts` and every existing Provider spec file still passes with the updated assertion.
- **Risks:** None beyond a mechanical, narrow edit — directly caught by the build step if any implementer is missed.
- **Completion Criteria:** Full monorepo build succeeds with the new signature everywhere; all pre-existing tests (S1-001–S1-011) still pass.

## WP3 — `WyckoffProvider`'s real `normalize()` mapping

**Maps to:** Scope item 3 (Wyckoff half).

- **Deliverables:** `wyckoff-normalize.util.ts` mapping Wyckoff's own Evidence/Interpretation to the 7 dimensions: `STRUCTURE` and `VOLUME` from SOS/SOW and Climax-event evidence (Wyckoff's native strengths); `TREND` from the primary phase hypothesis's implied bias (Phase D/E resolved, else `NEUTRAL`); `CONFIRMATION` from whether the schematic reached a fully-confirmed phase; `MOMENTUM`, `LIQUIDITY`, `VOLATILITY` reported `NOT_APPLICABLE` (no native V1 concept for these) — never a fabricated reading. Each mapping's rationale disclosed in-file, per the Brief's own "which of each Provider's own fields feed which dimension" Missing Decision.
- **Acceptance Criteria:** "Every registered Provider's `normalize()` output always contains exactly seven entries... valid reading... a `strength` in `[0,100]`... a non-empty explanation" (Brief, Acceptance Criteria), applied to Wyckoff specifically.
- **Verification Steps:** Unit tests: a fully-confirmed Phase D/E Accumulation result maps to `TREND`/`STRUCTURE`/`VOLUME`/`CONFIRMATION` all `BULLISH`; the symmetric Distribution case maps `BEARISH`; a `Limitations`-only (no schematic found) result maps all 7 dimensions `NOT_APPLICABLE` with `strength 0`, never throwing.
- **Risks:** None beyond the standing "no fabricated reading" discipline — directly tested via the `Limitations` case.
- **Completion Criteria:** All tests pass; `WyckoffProvider.normalize()` calls this util and returns its result; no other Wyckoff file touched beyond wiring.

## WP4 — `IctSmcProvider`'s real `normalize()` mapping

**Maps to:** Scope item 3 (ICT/SMC half).

- **Deliverables:** `ict-smc-normalize.util.ts` mapping: `LIQUIDITY` from Liquidity Sweep direction (ICT/SMC's native strength); `STRUCTURE` from Order Block direction; `CONFIRMATION` from Fair Value Gap direction; `TREND` from the primary bias hypothesis; `MOMENTUM`, `VOLATILITY`, `VOLUME` reported `NOT_APPLICABLE` (V1 ICT/SMC has no native concept for these, and — per S1-010's own disclosed design — never uses volume at all).
- **Acceptance Criteria:** Same conformance line as WP3, applied to ICT/SMC.
- **Verification Steps:** Unit tests mirroring WP3's structure: a Bullish-bias result with Liquidity Sweep/Order Block/FVG all present maps all four active dimensions `BULLISH`; a `Limitations`-only result maps all `NOT_APPLICABLE`.
- **Risks:** None beyond the same fabrication-avoidance discipline.
- **Completion Criteria:** All tests pass; wired into `IctSmcProvider.normalize()`.

## WP5 — `ElliottWaveProvider`'s real `normalize()` mapping

**Maps to:** Scope item 3 (Elliott Wave half).

- **Deliverables:** `elliott-wave-normalize.util.ts` mapping: `TREND` and `STRUCTURE` from the primary wave count's direction; `MOMENTUM` from the primary hypothesis's Wave 3 extension guideline check (a strong extension match implies momentum confirmation in the wave's own direction, else `NOT_APPLICABLE`); `CONFIRMATION` from whether Detection Confidence (weakest Rule margin) clears a disclosed threshold; `LIQUIDITY`, `VOLATILITY`, `VOLUME` `NOT_APPLICABLE` (no native V1 concept; Elliott Wave uses no volume, per S1-011's own disclosed design).
- **Acceptance Criteria:** Same conformance line, applied to Elliott Wave.
- **Verification Steps:** Unit tests mirroring WP3/WP4: a surviving Bullish candidate with a strong Wave 3 extension maps `TREND`/`STRUCTURE`/`MOMENTUM` `BULLISH`; a `Limitations`-only (no surviving candidate) result maps all `NOT_APPLICABLE`.
- **Risks:** None beyond the same discipline.
- **Completion Criteria:** All tests pass; wired into `ElliottWaveProvider.normalize()`.

## WP6 — Shared `normalize()` conformance test suite

**Maps to:** Scope item 4.

- **Deliverables:** `normalize-vocabulary-conformance.spec.ts` — a single, centrally-located test file (per ADR-007: "maintained centrally... to prevent semantic drift") that instantiates all three real Providers (via the same DI pattern as their own specs) against a representative fixture series and asserts, generically, that every returned `NormalizedProviderOutput` has exactly 7 signals, one per `NormalizedDimension`, each with a reading in the valid set, `strength` in `[0,100]`, and a non-empty explanation whenever `reading !== 'NOT_APPLICABLE'`.
- **Acceptance Criteria:** "verified by the shared conformance test suite (Scope item 4) run against all three real Providers" (Brief, Acceptance Criteria).
- **Verification Steps:** The suite runs parametrically over all three Providers (a single test body, looped or `it.each`-style, not three copy-pasted tests) — itself a safeguard against the semantic-drift risk, since adding a fourth Provider later means adding one line to this suite's Provider list, not writing a new conformance test from scratch.
- **Risks:** Brief Risk "Semantic-drift risk" — resolved by this WP's existence, not merely mitigated.
- **Completion Criteria:** Suite passes against all three Providers.

## WP7 — `ConfluenceWeightStrategy` and `EqualWeightStrategy`

**Maps to:** Scope item 5.

- **Deliverables:** `confluence.types.ts`'s `ConfluenceWeightStrategy` interface (`computeWeight(providerId, methodologyFamily): {weight: number; weightExplanation: string}`); `equal-weight.strategy.ts`'s `EqualWeightStrategy` implementation returning `weight: 1.0` and `weightExplanation: "equal weighting, no differential weighting strategy active yet"` (ADR-007's own exact wording) for every input; `confluence.tokens.ts`'s `CONFLUENCE_WEIGHT_STRATEGY` token.
- **Acceptance Criteria:** "`EqualWeightStrategy.computeWeight()` returns weight `1.0` and the exact disclosed `weightExplanation` for every Provider" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test calling `computeWeight()` for several distinct `providerId`/`methodologyFamily` inputs, asserting identical `{weight: 1.0, weightExplanation: "equal weighting, no differential weighting strategy active yet"}` every time.
- **Risks:** None — a trivial, fully-specified implementation.
- **Completion Criteria:** Test passes; token registered (wiring is WP11).

## WP8 — Methodology-family-aware grouping

**Maps to:** Scope item 6.

- **Deliverables:** `confluence-family-grouping.util.ts`'s `groupByFamily(outputs: NormalizedProviderOutput[]): FamilyGroup[]` — Providers sharing a non-null `methodologyFamily` are grouped together; Providers with no declared family (or a unique one) form a singleton group of their own. Never edits or assigns `methodologyFamily` — reads it only.
- **Acceptance Criteria:** "A dedicated unit test constructs two fixture Providers sharing a `methodologyFamily` and confirms their combined contribution... counts as one family-unit, not two independent confirmations" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test with 4 fixture `NormalizedProviderOutput`s: two sharing family `'FAMILY_X'`, two with distinct/no family — asserts exactly 3 groups, one containing both `'FAMILY_X'` members.
- **Risks:** Brief Risk "Family-grouping under-exercise risk" — resolved by this WP's dedicated fixture test, independent of real Provider data (none of the three real Providers currently share a family).
- **Completion Criteria:** Test passes; grouping function ready for WP9's aggregation to consume.

## WP9 — Per-dimension aggregation, disagreement, and top-3 attribution

**Maps to:** Scope item 7; resolves Finding C.

- **Deliverables:** `confluence-dimension-aggregator.util.ts`'s `aggregateDimension(dimension, familyGroups, weightStrategy): DimensionConfluence` — for one dimension: computes each family group's own combined signal (e.g. the group's strongest/first non-`NOT_APPLICABLE` member, or an intra-family average — a disclosed calibration choice), applies `EqualWeightStrategy`'s weight per group, nets a weighted `BULLISH`/`BEARISH` score to an aggregate reading (`NEUTRAL` on a tie or all-`NOT_APPLICABLE`), sets a `disagreement: boolean` flag when at least one non-`NOT_APPLICABLE` group reads `BULLISH` and at least one reads `BEARISH`, and lists up to the top 3 contributing Providers per side, ranked by their own Interpretation Confidence — resolving Finding C exactly as its own Recommendation states.
- **Acceptance Criteria:** "A dedicated unit test constructs a scenario where participating Providers' normalized readings for one dimension disagree... asserting the dimension's disagreement flag is set and the top-3-by-confidence contributing Providers per side are correctly listed and bounded at 3 regardless of how many Providers participate" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test with 5 fixture Providers for one dimension (3 `BULLISH` at varying confidence, 2 `BEARISH`) asserts `disagreement: true`, exactly 3 `BULLISH`-side Providers listed (highest-confidence 3 of the 3 available — trivially all 3, so a second test with 5 `BULLISH` + 2 `BEARISH` confirms exactly the top 3 of the 5 are listed, by confidence, not all 5). A third test with all-agreeing signals asserts `disagreement: false`.
- **Risks:** Brief Risk "False-consensus risk" and "Premature-classification risk" — the former resolved by never collapsing the two sides into one number; the latter avoided by explicitly not attempting expected-vs-unexpected classification (Non-Scope).
- **Completion Criteria:** All tests pass; aggregation verified `O(Providers × 7)` by construction (single pass per dimension, confirmed at Sprint Audit).

## WP10 — Provider participation reporting

**Maps to:** Scope item 8.

- **Deliverables:** A `ProviderParticipationSummary` built directly from the Execution Engine's own `ExecutionRunResult` (both tiers merged) — `participating: readonly ProviderReference[]`, `nonParticipating: readonly {providerId, reason, detail}[]` — read, not re-derived or inferred.
- **Acceptance Criteria:** "A dedicated unit test confirms `ConfluenceResult` reports Provider participation explicitly... matching the Execution Engine's own `ExecutionRunResult`... never inferred" (Brief, Acceptance Criteria).
- **Verification Steps:** Unit test mocking `PROVIDER_EXECUTION_ENGINE.runNewAnalysis()` to return a fixed set of participating/non-participating entries across both tiers, asserting `ConfluenceResult`'s participation summary matches exactly, including non-participation reasons.
- **Risks:** None beyond ensuring both tiers are merged correctly (a fast-tier non-participant must not be silently dropped just because it isn't in the slow-tier result).
- **Completion Criteria:** Test passes.

## WP11 — `ConfluenceService` assembly

**Maps to:** Scope item 9.

- **Deliverables:** `confluence.service.ts`'s `ConfluenceService` (`CONFLUENCE_ENGINE` token) — injects `PROVIDER_EXECUTION_ENGINE` and `ANALYSIS_PROVIDERS`; awaits both `runNewAnalysis()` tiers; for each participating entry, looks up the matching Provider instance (by `providerId`) to read its `methodologyFamily` and call `.normalize(result)`; groups (WP8), aggregates per dimension (WP9), and assembles the final `ConfluenceResult` — 7 `DimensionConfluence` entries, the participation summary (WP10), and a per-Provider reference list (`providerId`/`methodologyFamily` only — full traceability recoverable from the same call's own `AnalysisProviderResult[]`, not embedded). Registered into `analysis-engine.module.ts`.
- **Acceptance Criteria:** "A dedicated unit test confirms `ConfluenceResult`'s per-Provider references carry only `providerId`/`methodologyFamily`... and that the full trace remains independently recoverable" (Brief, Acceptance Criteria); "is the third entry"-style module-registration checks, adapted: `CONFLUENCE_ENGINE` resolves from the real module wiring.
- **Verification Steps:** Integration test resolving `CONFLUENCE_ENGINE` from a test module built the same way as `analysis-engine.module.spec.ts` (real shared services, real Providers, no live Prisma connection) and calling it against a representative series, asserting the full `ConfluenceResult` shape. A second test confirms the per-Provider reference objects contain no `traceability`/`evidence`/`interpretation` fields.
- **Risks:** None beyond ordinary integration/wiring risk, caught by the integration test and `AppModule`'s own build.
- **Completion Criteria:** `CONFLUENCE_ENGINE` resolves correctly in production wiring; `pnpm --filter @zenith/api build` succeeds.

## WP12 — Golden-dataset / reference-scenario conformance test

**Maps to:** Scope item 10.

- **Deliverables:** A test constructing a realistic multi-Provider scenario (mocked `SWING_DETECTOR`/`REGIME_CONTEXT`/`INDICATOR_ENGINE` feeding all three real Providers with a shared series) engineered to produce genuine agreement on at least one dimension (e.g. all three read `TREND` `BULLISH`) and genuine disagreement on at least one other (e.g. `STRUCTURE` split), verifying `ConfluenceResult` reports both correctly.
- **Acceptance Criteria:** "verifying `ConfluenceResult` reports each correctly and does not silently resolve the disagreement into a false consensus" (Brief, Acceptance Criteria).
- **Verification Steps:** Assert the agreeing dimension's `disagreement: false` and correct aggregate reading; assert the disagreeing dimension's `disagreement: true` with correct per-side attribution; assert no dimension's aggregate reading is `NEUTRAL` merely because it disagreed (a `NEUTRAL` reading must reflect a genuine tie/no-signal, not disagreement papered over).
- **Risks:** None beyond ensuring the fixture is honestly engineered, not reverse-fitted to the assertions — the same "SOURCING DISCLOSURE"-style honesty precedent as every prior golden-dataset test.
- **Completion Criteria:** Test passes.

## WP13 — Full build/lint/test verification

**Maps to:** Sprint-wide Acceptance Criteria.

- **Deliverables:** None (verification only).
- **Acceptance Criteria:** Full monorepo build/lint/test green; zero regression across S1-001–S1-011.
- **Verification Steps:** `pnpm turbo run build lint test`; `git diff` across every `package.json`/`pnpm-lock.yaml` confirming zero dependency changes; confirm zero new Prisma schema changes; confirm no controller/HTTP route introduced.
- **Risks:** None beyond ordinary integration risk.
- **Completion Criteria:** All tasks green.

## WP14 — Sprint Audit

**Maps to:** Sprint-wide Architecture Requirements, Risks, and Escalation Triggers.

- **Deliverables:** None (audit only) — any issue found is fixed immediately if non-blocking, or escalated if it constitutes a genuine architectural gap.
- **Acceptance Criteria:** Every Scope item (1-10) re-verified end to end; direct grep confirming the Confluence module contains no Wyckoff/ICT-SMC/Elliott-Wave-specific logic (Architecture Requirements' "no central translator"); confirm dimension aggregation is genuinely `O(Providers × 7)` by code inspection (no nested Provider loop).
- **Verification Steps:** Re-read every new/modified file against the Brief's Scope/Non-Scope/Risks line by line; re-run the full monorepo suite once more after any fix.
- **Risks:** This is the checkpoint where a genuine architectural gap would surface, if one exists.
- **Completion Criteria:** No unresolved Critical finding; full suite green after any fix.

## WP15 — Decision Log, closure, completion report

**Maps to:** Deliverables section.

- **Deliverables:** `DEC-2026-016` recording the Missing Decisions (per-Provider dimension mappings, `strength` scale calibration, top-3 attribution bound, vocabulary schema version). `S1-012_SPRINT_BRIEF.md`'s Sprint Closure updated. `documentation/ai/S1-012_COMPLETION_REPORT.md` (AI-030) written. `09_PROJECT_BRAIN.md`/`00_AI_INDEX.md` updated.
- **Acceptance Criteria:** Definition of Done satisfied in full.
- **Verification Steps:** Cross-check every Brief Acceptance Criteria line against the completion report's FACTS section.
- **Risks:** None — documentation-only.
- **Completion Criteria:** Sprint marked CLOSED; all closure documents committed and pushed.

---

# Task Breakdown Consistency Review

- Every Work Package traces to a specific, numbered Scope item in the approved `S1-012_SPRINT_BRIEF.md`.
- Dependency order verified: WP1 (schema + signature) → WP2 (mechanical implementer updates, keeps the build green) → WP3/WP4/WP5 (real per-Provider mappings, independent of each other) → WP6 (conformance suite, needs all three real mappings) → WP7 (weight strategy, independent) → WP8 (family grouping, needs normalized outputs' shape from WP1) → WP9 (aggregation, needs WP7's weights and WP8's groups) → WP10 (participation, independent, needs Execution Engine only) → WP11 (assembly, needs WP3-WP10 all complete) → WP12 (golden-dataset, needs the full assembled service) → WP13/WP14/WP15 (verification, audit, closure).
- No Work Package touches `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, ADR-005/006/007's own text, or either governing Brief's substantive Scope/Non-Scope/Acceptance Criteria — only WP15 touches the Brief, and only its Sprint Closure section.
- No Work Package adds an HTTP endpoint, a fourth Provider, real differential weighting, or Trace Store persistence — all remain correctly excluded, matching the Brief's Non-Scope exactly.

No Critical issue found during this review.

---

# Related Documents

- `documentation/zos/sprints/S1-012_SPRINT_BRIEF.md`
- `documentation/zos/12_ADR_INDEX.md` (ADR-006, ADR-007)
- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md`
- `documentation/ai/S1-011_TASK_BREAKDOWN.md` (structural precedent)
