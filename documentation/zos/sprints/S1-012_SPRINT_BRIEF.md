# S1-012 SPRINT BRIEF — Confluence Engine

**Document ID:** ZOS-S1-012
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Approved

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-012
- **Sprint Name:** Confluence Engine
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`, under the same Implementation-Engineer placement basis recorded in every prior sprint's own Brief)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-13
- **Approved By:** Architecture Team (2026-07-13 — autonomous full-lifecycle execution authorized; see Approval Section)

---

# Sprint Objective

S1-009, S1-010, and S1-011 each registered a real Analysis Provider (Wyckoff, ICT/SMC, Elliott Wave) — three structurally independent methodologies, each with its own tier, Confidence rules, and disclosed Methodology Confidence Ceiling. Every one of them shipped with `normalize(): void` as a documented no-op, per the Architecture Team's own S1-008 decision, deferred exactly to this sprint (ADR-006: "this ADR establishes only that the method exists... its target vocabulary, versioning, and conformance requirements are defined exclusively by ADR-007"). **S1-012 is where that deferral is paid off**: the first sprint where the Analysis Provider Framework's real purpose — letting genuinely different analytical schools be compared, not just individually consumed — becomes observable.

This sprint's objective is explicitly **not** to vote and **not** to average confidence. Voting or averaging would silently discard exactly the information a professional trader needs most: *which* methodologies agree, *which* disagree, *why*, and what evidence underlies each side. A Confluence output that collapses three independent readings into one number would be a worse tool than reading the three Providers separately — it would manufacture false precision out of genuine, honest disagreement. The Confluence Engine's job is to make agreement and disagreement legible: per normalized dimension, which Providers contributed, what they each said, where they align, where they conflict, and why — never to resolve that conflict into an artificial consensus.

This is also the first sprint to modify code inside `WyckoffProvider`, `IctSmcProvider`, and `ElliottWaveProvider` since each was closed — a deliberate, anticipated exception to the Extension Guidelines' "no existing Provider changes" rule for a *new* Provider, not a violation of it: implementing an already-declared interface method (`normalize()`) against a vocabulary that did not exist until this sprint ratifies it is precisely what ADR-006/ADR-007 reserved for this moment, not an unplanned edit to another Provider's detection logic.

---

# Scope

Per ADR-006/ADR-007 (already Approved — this sprint implements, does not re-decide, their content) and the Extension Guidelines' "New normalized vocabulary dimension"/"New Analysis Provider" requirements:

1. **Normalized Vocabulary Schema (v1)** — `apps/api/src/analysis-engine/providers/normalized-vocabulary.types.ts`: the seven ratified dimensions (`TREND`, `MOMENTUM`, `LIQUIDITY`, `STRUCTURE`, `VOLATILITY`, `VOLUME`, `CONFIRMATION` — "Risk" explicitly excluded, reserved for a future Risk Engine, per ADR-007). Each dimension's reading is one of `BULLISH`/`BEARISH`/`NEUTRAL`/`NOT_APPLICABLE` (a Provider with nothing to say about a dimension reports `NOT_APPLICABLE`, never a fabricated `NEUTRAL`), paired with a 0–100 `strength` and a disclosed `explanation`. A `NormalizedProviderOutput` always carries all seven dimensions (additive/versioned per ADR-007 — a future eighth dimension defaults existing Providers to `NOT_APPLICABLE`, requiring no change to their own `normalize()`). This schema is generic, shared infrastructure (per ADR-007's "centralized by specification") — it lives alongside `AnalysisProviderResult`, not inside the Confluence module, since every Provider must import it to implement `normalize()`.
2. **`AnalysisProvider.normalize()`'s real signature**, completing the placeholder ADR-006 explicitly deferred: `normalize(result: AnalysisProviderResult): NormalizedProviderOutput` (was `normalize(): void`). This is the one interface change this sprint makes — anticipated by both governing ADRs, not a stop-condition "existing public contract becomes incompatible" break, since no Consumer has ever called it (S1-008's own text: "Nothing calls this method in S1-008 — Confluence, its only consumer, does not exist until S1-012") and its shape was explicitly reserved, unratified, for this exact sprint to define.
3. **Each registered Provider's own `normalize()` implementation**, decentralized by implementation (ADR-007) — confined to each Provider's own module directory, translating its own Evidence/Interpretation into the shared vocabulary using only its own domain knowledge (e.g. Wyckoff's SOS/SOW inform Structure/Volume; ICT/SMC's Liquidity Sweeps and Order Blocks inform Liquidity/Structure; Elliott Wave's wave direction informs Trend/Structure). A dimension a Provider's V1 scope has no native concept for reports `NOT_APPLICABLE` honestly, never a guessed reading.
4. **A shared `normalize()` conformance test suite** (ADR-007: "a shared conformance test suite... is maintained centrally... to prevent semantic drift"), asserting every registered Provider's `normalize()` output always carries exactly the seven dimensions, valid reading/strength values, and a non-empty explanation per non-`NOT_APPLICABLE` entry.
5. **`ConfluenceWeightStrategy` interface and `EqualWeightStrategy`** (ADR-007) — the only implementation this phase, weight `1.0` for every Provider, `weightExplanation: "equal weighting, no differential weighting strategy active yet"` (ADR-007's own exact wording), injected via a token so a future differential strategy requires no Provider or Confluence Engine contract change.
6. **Methodology-family-aware aggregation** — Providers sharing a `methodologyFamily` (self-declared, ADR-006; read-only here, per ADR-007, never assigned or edited) are combined into one contribution per family before cross-family aggregation, so agreement within a family is never counted as independent confirmation. No two of the three currently-registered Providers share a family, so this mechanism is proven correct via a dedicated fixture test (two same-family fixture Providers), not by incidental behavior on real data.
7. **Per-dimension aggregation with disagreement explanation**, computed at the normalized-dimension level only — **O(Providers × 7), never pairwise Provider-vs-Provider (O(Providers²))** (ADR-007) — reporting, for each of the seven dimensions: the aggregate reading, whether the participating Providers' readings for that dimension disagree, and (resolving Finding B... **resolving Finding C**, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`) a bounded list of up to the top 3 contributing Providers per side by their own Interpretation Confidence, restoring drill-down context without reintroducing the O(N²) cost.
8. **Explicit Provider participation reporting** — which Providers contributed vs. were unavailable (and why), read directly from the Execution Engine's own `ExecutionRunResult` (S1-008, unmodified) across both tiers, never inferred or silently omitted.
9. **`ConfluenceService`** (`CONFLUENCE_ENGINE` token) — awaits both `PROVIDER_EXECUTION_ENGINE.runNewAnalysis()` tiers fully (a complete, non-incremental V1 aggregation; incremental/partial Confluence for future Alerts Consumers is explicitly deferred, per `22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s own Future Compatibility section), normalizes every participating Provider's result, applies family grouping and `EqualWeightStrategy`, and assembles one `ConfluenceResult`: per-dimension aggregates, Provider participation, and a per-Provider reference list (`providerId`, `methodologyFamily`) — **full per-Provider traceability is referenced by Provider ID, not embedded** (ADR-007), recoverable from the same `AnalysisProviderResult[]` this same request/response already produced (no Trace Store persistence exists yet — still correctly deferred, see Non-Scope), bounding Confluence's own payload size independent of Provider count.
10. **Golden-dataset / reference-scenario conformance testing**: a constructed multi-Provider scenario demonstrating genuine cross-methodology agreement on one dimension and genuine disagreement on another, verifying the disagreement explanation and top-3 attribution are both correct and that agreement is never manufactured by construction.

---

# Non-Scope

Explicitly excluded, per ADR-007, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, and this Brief's own scope discipline:

- **Real differential weighting.** `EqualWeightStrategy` is the only implementation this phase; a future data-driven strategy requires historical validation data this sprint does not have, and its own superseding/additional Decision Log entry — the `ConfluenceWeightStrategy` interface exists precisely so that future strategy needs no Provider or Confluence contract change (ADR-007).
- **Expected-vs-unexpected disagreement classification via a "Methodology Conflict Matrix."** `22_ANALYSIS_ENGINE_ARCHITECTURE.md` states disagreement explanation should be "informed by" this Matrix, but no Provider yet self-declares a conflict-expectation tag to classify against, and the Matrix's own concrete schema was never ratified by ADR-007 as a required artifact. V1 reports raw, correctly-attributed disagreement (Scope item 7) without an expectedness classification layer — a disclosed, bounded scope decision, not an oversight, deferred to whichever future sprint introduces enough Providers/families for that classification to be evidence-based rather than speculative.
- **Trace Store persistence.** Still correctly deferred — S1-012 remains internal/composable only (no HTTP endpoint, see below), computed live within a single request/response; "referenced by ID, not embedded" (Scope item 9) is satisfied by Provider-ID reference into the same response's own `AnalysisProviderResult[]`, not a separately persisted trace record. This was the second of the two sprints (S1-009 or S1-012) originally named as candidates for this decision (S1-008 Sprint Brief); since S1-012 introduces no Consumer holding a cross-request reference either, the deferral continues, now flagged for genuine future attention if the next Consumer (Dashboard, Alerts) needs it.
- **Any HTTP endpoint, controller, or trader-visible output.** Continuing the S1-007–S1-011 precedent exactly: the Confluence Engine is internal and composable only. No Consumer (Dashboard, Alerts) exists yet.
- **Incremental/partial Confluence recomputation** for future Alert-style Consumers — `22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s own Future Compatibility section defers this explicitly; V1 performs one full aggregation per call.
- **A fourth Analysis Provider, or any change to the Provider Lifecycle, Execution Engine's dependency resolution, tiering, or circuit breaker.** This sprint consumes `PROVIDER_EXECUTION_ENGINE`/`ANALYSIS_PROVIDERS` exactly as they already exist; it does not add a Provider or change execution semantics.
- **"Risk" as an eighth normalized dimension.** Explicitly excluded from this phase by ADR-007, reserved for a future, distinct Risk Engine.
- **Any new Prisma model or new runtime dependency.**

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables: source code implementing Scope items 1–10 — a new `apps/api/src/analysis-engine/providers/normalized-vocabulary.types.ts`, a modified `analysis-provider.types.ts` (`normalize()`'s signature), modified `normalize()` implementations in all three registered Providers plus the S1-008 `FixtureProvider` test fixture, and a new `apps/api/src/analysis-engine/confluence/` module tree; a Task Breakdown; a completion report per `10_AI_ENGINEER_GUIDE.md`'s structure; a Decision Log entry recording the Missing Decisions fixed at implementation time; a final assessment against this Brief's Acceptance Criteria and Definition of Done.

---

# Dependencies

- S1-008's `AnalysisProvider` contract, `ANALYSIS_PROVIDERS`, and `ProviderExecutionEngine`/`PROVIDER_EXECUTION_ENGINE` — consumed; `AnalysisProvider.normalize()`'s signature is completed (not redesigned) per this sprint's own Scope item 2, an explicitly ADR-anticipated change.
- S1-009/S1-010/S1-011's `WyckoffProvider`/`IctSmcProvider`/`ElliottWaveProvider` — each gains a real `normalize()` implementation; no other change to any of their detection logic, Confidence taxonomy, or Traceability.
- No new runtime or development dependency anticipated — pure TypeScript computation within the existing NestJS stack, per ADR-007's Consequences.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope, executing the full Sprint lifecycle autonomously per the Architecture Team's explicit authorization for this sprint (see Approval Section).

---

# Architecture Requirements

- Implements exactly what ADR-007 specifies — no deviation, no addition beyond the disclosed, bounded V1 choices in Scope/Non-Scope above.
- **`normalize()`'s signature change is this sprint's one authorized interface completion**, not a broader contract redesign — every other `AnalysisProvider` field/method (`evidence`, `interpretation[]`, `limitations`, `traceability`, the four Confidence kinds, `id`, `methodologyFamily`, `tier`, `lifecycleState`, `dependsOn`, `computationVersion`, `analyze()`) is unchanged.
- **The Confluence Engine never authors or edits `methodologyFamily`** — it is read-only, self-declared Provider metadata (ADR-006/007).
- **No pairwise Provider-vs-Provider comparison anywhere** — disagreement computation is strictly dimension-level, `O(Providers × 7)`.
- **No central translator** — each Provider's `normalize()` is implemented inside that Provider's own module directory, using only that Provider's own domain knowledge; the Confluence module itself contains no Wyckoff/ICT-SMC/Elliott-Wave-specific logic.
- Per ADR-001, ADR-003, ADR-004, ADR-005: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged. All price/confidence arithmetic uses `Prisma.Decimal` where the existing contract already does; `strength`/weight values may use plain `number` (0–100), consistent with the Confidence Model's own existing `Prisma.Decimal` convention for confidence but not mandating it for a genuinely new, dimension-level aggregate concept ADR-007 does not itself specify as `Decimal`-typed.

---

# Acceptance Criteria

- `AnalysisProvider.normalize()` has signature `(result: AnalysisProviderResult) => NormalizedProviderOutput`; every current implementer (`WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`, `FixtureProvider`) is updated to match, with zero change to any other interface member.
- Every registered Provider's `normalize()` output always contains exactly seven entries, one per ratified dimension, each with a valid reading (`BULLISH`/`BEARISH`/`NEUTRAL`/`NOT_APPLICABLE`), a `strength` in `[0, 100]`, and (for every non-`NOT_APPLICABLE` entry) a non-empty explanation — verified by the shared conformance test suite (Scope item 4) run against all three real Providers.
- `EqualWeightStrategy.computeWeight()` returns weight `1.0` and the exact disclosed `weightExplanation` for every Provider, verified by a dedicated unit test.
- A dedicated unit test constructs two fixture Providers sharing a `methodologyFamily` and confirms their combined contribution to a dimension's aggregate counts as one family-unit, not two independent confirmations — proving the family-grouping mechanism works even though no two real registered Providers currently share a family.
- A dedicated unit test constructs a scenario where participating Providers' normalized readings for one dimension disagree (at least one `BULLISH`, at least one `BEARISH`), asserting the dimension's disagreement flag is set and the top-3-by-confidence contributing Providers per side are correctly listed and bounded at 3 regardless of how many Providers participate.
- A dedicated unit test confirms `ConfluenceResult` reports Provider participation explicitly (participating vs. non-participating, with reason), matching the Execution Engine's own `ExecutionRunResult` across both tiers, never inferred.
- A dedicated unit test confirms `ConfluenceResult`'s per-Provider references carry only `providerId`/`methodologyFamily` (not embedded full traceability), and that the full trace remains independently recoverable from the same call's own `AnalysisProviderResult[]`.
- A golden-dataset/reference-scenario test constructs a realistic multi-Provider run demonstrating both genuine agreement (on at least one dimension) and genuine disagreement (on at least one other), verifying `ConfluenceResult` reports each correctly and does not silently resolve the disagreement into a false consensus.
- Disagreement/aggregation computation is verified `O(Providers × 7)` by construction (a single pass over participating Providers per dimension, never a nested Provider×Provider comparison) — verified by code inspection during the Sprint Audit, the same method used at every prior sprint's own architecture-conformance checks.
- No HTTP endpoint, controller, or Swagger surface is introduced. No new Prisma model. No new runtime dependency.
- All S1-001 through S1-011 acceptance criteria continue to pass — no regression, including the `analysis-provider.types.spec.ts`/`FixtureProvider`-based Execution Engine tests updated for the new `normalize()` signature.
- New code has full unit test coverage across all items above, including the golden-dataset/reference-scenario conformance test.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated, and the sprint has been formally closed. Per the Architecture Team's explicit authorization for this sprint, Sprint Brief and Task Breakdown approval is granted concurrently with this autonomous-execution directive (see Approval Section) rather than gated on separate intermediate sign-off, since no genuine architectural decision (per this Brief's own Escalation Triggers) arose during drafting.

---

# Risks

- **False-consensus risk (the sprint's central named risk).** Any aggregation shortcut that resolves disagreement into a single number would defeat this sprint's entire purpose. Mitigated by Scope items 6–7's explicit, tested design: family-aware grouping before aggregation, and a disagreement flag with attributed contributing Providers, never a collapsed average.
- **Interface-change risk.** Changing `normalize()`'s signature touches every existing Provider. Mitigated by this being an explicitly ADR-anticipated, zero-real-Consumer change (Architecture Requirements), and by the Acceptance Criteria requiring every implementer updated with zero change to any other interface member — a narrow, mechanical, well-bounded edit, not a redesign.
- **Semantic-drift risk.** Three Providers translating independently into the same vocabulary could silently diverge in what "Bullish Structure" means. Mitigated by Scope item 4's shared conformance test suite and by each Provider's `normalize()` doc comment disclosing exactly which of its own Evidence/Interpretation fields feed which dimension.
- **Premature-classification risk.** Attempting the "expected vs. unexpected disagreement" distinction (Finding C's broader context) without real supporting data would manufacture false precision of a different kind. Mitigated by this Brief's own Non-Scope: V1 reports raw, attributed disagreement only.
- **Family-grouping under-exercise risk.** No two real registered Providers currently share a `methodologyFamily`, so a real-data bug in this mechanism could hide until a fourth Provider triggers it. Mitigated by Acceptance Criteria's dedicated fixture-based test proving the mechanism correct today, independent of real Provider data.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, stop and escalate if:

- A new runtime or development dependency is required.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, ADR-005, ADR-006 (beyond `normalize()`'s already-anticipated signature completion), or ADR-007 is proposed or appears necessary.
- The generic vocabulary schema proves insufficient to express a genuine Provider signal without distortion, or a Provider's own domain requires an eighth dimension — a real architectural gap, escalate rather than inventing one unilaterally.
- Scope expansion is requested, including real differential weighting, Trace Store persistence, an HTTP endpoint, a fourth Provider, or "Risk" as a dimension (all explicitly Non-Scope).
- Family-grouping or dimension-level (never pairwise) disagreement computation cannot be implemented as specified without a genuine architectural change.

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

Calibration choices within ADR-007's already-approved design, resolved via a Decision Log entry at implementation time, per the DEC-2026-009/011/012/013/014/015 precedent — not requiring pre-approval:

- Per-Provider `normalize()` dimension mappings (which of each Provider's own Evidence/Interpretation fields feed which of the seven dimensions).
- The exact `strength` (0–100) scale calibration per Provider per dimension.
- The bounded top-N (3, per Finding C's own recommendation) contributing-Provider attribution per disagreement side.
- `NormalizedProviderOutput`'s vocabulary schema version numbering (starting `1.0.0`, the same convention as every prior sprint's `computationVersion`/`contractVersion`).

---

# Approval Section

- **Approval Status:**
  - [ ] Proposed
  - [ ] Under Review
  - [x] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** Architecture Team
- **Date Approved:** 2026-07-13

Approved concurrently with the Architecture Team's explicit authorization to execute this Sprint's complete lifecycle (Phases 1–9) autonomously, without intermediate approval gating, per the Architecture Team's own instruction: proceed continuously unless a genuine architectural decision (per this Brief's own Escalation Triggers) is required. Self-audited by the Implementation Engineer prior to and during drafting: no Critical findings identified, and no item in this Brief rises to a genuine architectural contradiction requiring a separate design decision — ADR-006 and ADR-007 already fully specify this sprint's governing design; this Brief only sequences their already-approved content into implementable scope, exactly as every prior sprint's Brief did for its own governing ADR.

---

# Sprint Closure

- **Sprint Status:** OPEN
- **Closed Date:** Pending
- **Completion Report:** Pending (`documentation/ai/S1-012_COMPLETION_REPORT.md`, AI-030)
- **Final Implementation Commits:** Pending
- **Related ADR:** ADR-007 (see `12_ADR_INDEX.md`); ADR-006 (`normalize()`'s signature completion)
- **Related Decisions:** Pending (`DEC-2026-016`)

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (Normalization, Confluence Engine, Additional Findings Finding C — this Brief's primary governing text)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006, ADR-007 — this sprint's governing decisions)
- `documentation/zos/sprints/S1-008_SPRINT_BRIEF.md` (the Execution Engine and contract this sprint completes)
- `documentation/zos/sprints/S1-009_SPRINT_BRIEF.md`, `S1-010_SPRINT_BRIEF.md`, `S1-011_SPRINT_BRIEF.md` (the three Providers gaining real `normalize()` implementations)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md`
