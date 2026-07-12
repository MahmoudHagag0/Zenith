# S1-008 SPRINT BRIEF — Analysis Provider Framework

**Document ID:** ZOS-S1-008
**Template Reference:** `SPRINT_BRIEF_TEMPLATE.md` (ZOS-SBT)
**Status:** Proposed

------------------------------------------------------------------------

# Sprint Identification

- **Sprint ID:** S1-008
- **Sprint Name:** Analysis Provider Framework
- **Milestone:** M1 — Core Platform (per `08_ROADMAP.md`, under the same Implementation-Engineer placement basis recorded in `S1-007_SPRINT_BRIEF.md`)
- **Phase:** Phase 1 — Engineering Foundation (per `09_PROJECT_BRAIN.md`)
- **Date Drafted:** 2026-07-12
- **Approved By:** *(pending)*

---

# Sprint Objective

ADR-006 (`12_ADR_INDEX.md`) specifies the Analysis Provider Framework — the plugin registry, Execution Engine, and standard `AnalysisProvider` contract every future methodology Provider (Wyckoff, ICT/SMC, Elliott Wave, and others) will implement. This sprint builds exactly that framework, per ADR-006's own text: "*Every future Provider sprint (S1-009 onward) implements this exact contract.*" **This sprint implements the framework only — it registers no real methodology Provider.** S1-007 delivered the computation substrate (Indicator Engine, Swing Detection, Regime/Context Service) this framework's future Providers will consume; S1-008 delivers the mechanism those Providers will plug into.

---

# Scope

Per ADR-006 (full specification there — not repeated here):

1. **`AnalysisProvider` interface and base contract types** — `contractVersion`, `evidence`, `interpretation` (always an array), `limitations`, a `traceability` record (in-memory shape only — see Non-Scope), the four-part Confidence taxonomy (Detection / Interpretation / Regime-Adjusted / Methodology Confidence Ceiling — `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, "Confidence Model"), optional `methodologyFamily`, `computationVersion`, a Provider Lifecycle state (`ACTIVE`/`DEPRECATED`/`RETIRED` — "Provider Lifecycle"), and a `normalize()` method **signature only** (ADR-006 establishes only that it exists; ADR-007 defines its real vocabulary — see Non-Scope and Decisions Requiring Architecture Team Approval).
2. **Provider registry** — NestJS multi-provider pattern with a factory provider exposing the registered set as an array, per ADR-006's Decision.
3. **Execution Engine** — resolves declared Provider dependencies by stable token (never concrete-class import), topologically sorts before invocation, tags each Provider fast-tier or slow-tier (slow-tier never blocks fast-tier results), reports non-participating Providers explicitly and distinctly from participating ones (never silently neutral/agreeing), and never lets a Provider throw past its `Limitations` contract.
4. **Circuit breaker** — a Provider failing/timing out repeatedly enters an open-circuit state and is excluded from invocation until a reset timeout elapses, reusing ADR-003's retry/backoff philosophy for in-process invocation; reported as non-participating, never silently dropped.
5. **Provider Lifecycle gating** — `ACTIVE` Providers participate in new runs; `DEPRECATED` Providers are excluded from new runs but remain executable (for historical/backtested reproduction); `RETIRED` Providers are not executable at all.
6. **Observability** — per-Provider latency, failure/timeout rate, and circuit-breaker state, plus an aggregate per-Provider health signal (participation rate, average confidence, failure rate over a rolling window), reusing `MarketDataProvider.checkHealth()`'s precedent shape (ADR-003), via the existing Pino logging channel — no new dependency.
7. **Test coverage** — the Execution Engine (dependency resolution, cycle detection, tier separation, partial failure, circuit breaker, lifecycle gating) is verified using in-test-only fixture Providers that implement `AnalysisProvider`. These fixtures are never registered in `AnalysisEngineModule` and carry no methodology content — they exist solely to exercise the framework, the same role synthetic bars play in S1-007's tests.

**Note on Provider Lifecycle governance:** `22_ANALYSIS_ENGINE_ARCHITECTURE.md` requires a Decision Log entry recording rationale and last-active contract version whenever a Provider is retired. That governance rule applies once a real Provider exists to retire (S1-009 onward); this sprint's fixture Providers are test scaffolding only, so exercising the `RETIRED` state in a test does not itself require a Decision Log entry.

---

# Non-Scope

Explicitly excluded, per ADR-006 and `22_ANALYSIS_ENGINE_ARCHITECTURE.md`:

- **Any real Analysis Provider** (Wyckoff, ICT/SMC, Elliott Wave, Harmonic Patterns, or any other methodology) — per ADR-006, these begin at S1-009; choosing which methodology is implemented first is an Architecture Team scope decision for that sprint, not this one.
- **`normalize()`'s target vocabulary, versioning, and conformance suite** — ADR-007, S1-012.
- **The Confluence Engine** (aggregation, `ConfluenceWeightStrategy`, disagreement explanation) — ADR-007, S1-012.
- **Trace Store persistence** (retention/TTL/cleanup mechanics) — `22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s Trace Store section defers the storage technology to "S1-008/S1-012"; this sprint returns the `traceability` record in-memory as part of a Provider's output only. No trace record is persisted, because no real Provider exists yet to produce one worth retaining, and Confluence (the by-ID referencing consumer) does not exist until S1-012. Persisting traces is deferred to whichever of S1-009 (first real Provider) or S1-012 (Confluence) first needs it.
- **Any HTTP endpoint, controller, or trader-visible output** — this sprint's framework is internal and composable only, consistent with S1-005/S1-007's precedent.
- **Any new Prisma model or new runtime dependency.**

---

# Deliverables

Per `07_ENGINEERING_WORKFLOW.md` Deliverables, applied to this sprint's scope: source code implementing Scope items 1–7 as a new `apps/api/src/analysis-engine/providers` module tree (registry, Execution Engine, base `AnalysisProvider` contract types, fixture-only test support) — the only component affected is `apps/api`; a completion report per `10_AI_ENGINEER_GUIDE.md`'s structure; a Decision Log entry recording the Missing Decisions once fixed at implementation time; a final assessment against this Brief's Acceptance Criteria and Definition of Done.

---

# Dependencies

- S1-007's Analysis Engine module (`INDICATOR_ENGINE`, `SWING_DETECTOR`, `REGIME_CONTEXT` tokens) — available for a future Provider to consume; not directly exercised by this sprint's own tests, which use fixtures.
- ADR-003's retry/backoff and `checkHealth()` precedent, reused, not modified.
- No new runtime or development dependency anticipated — pure TypeScript/NestJS, per ADR-006's Consequences.

---

# Assigned Implementation Engineer

AI Implementation Engineer, per `documentation/ai/AI_WORKFLOW.md`, operating under Architecture Team supervision and strictly within this Brief's Approved Scope.

---

# Architecture Requirements

- Implements exactly what ADR-006 specifies — no deviation, no addition, no reinterpretation.
- Token-based dependency injection only, per the `MARKET_DATA_PROVIDER`/`INDICATOR_ENGINE` precedent.
- No interpretation content of any kind originates in this sprint — the framework carries Providers' `evidence`/`interpretation`/`limitations`, it does not generate any itself (there are no real Providers yet).
- Per ADR-001, ADR-003, ADR-004, ADR-005: unchanged. Per `15_CODING_STANDARDS.md`: strict TypeScript mode; no secrets logged.

---

# Acceptance Criteria

- The `AnalysisProvider` interface exists with every field ADR-006 requires, verified by a fixture Provider implementing it exactly.
- The Provider registry token resolves to an empty array with no Providers registered in `AnalysisEngineModule`, and to the correct set when fixture Providers are registered in a test module.
- The Execution Engine correctly topologically sorts a declared dependency chain (e.g. fixture C depends on fixture B depends on fixture A) and invokes them in valid order; a cyclic declaration (A→B→A) is detected and rejected with a typed error, never a silent infinite loop or unhandled crash.
- A slow-tier fixture Provider's artificial delay does not delay a fast-tier fixture Provider's result in the same execution.
- A fixture Provider that throws is reported as non-participating; the Execution Engine's output distinguishes "N of M available Providers participated" from the full registered count.
- After a fixture Provider fails/times out past a disclosed threshold, it opens its circuit and is excluded from subsequent invocations without being re-invoked, until a disclosed reset timeout elapses; reported as non-participating while open, never dropped silently.
- `ACTIVE` fixture Providers participate in a new run; `DEPRECATED` fixture Providers are excluded from a new run but still invocable directly; `RETIRED` fixture Providers cannot be invoked at all.
- Per-Provider latency, failure/timeout rate, and circuit-breaker state are observable via the existing Pino logger for every fixture Provider exercised in tests.
- No HTTP endpoint, controller, or Swagger surface is introduced.
- No new Prisma model or new runtime dependency is introduced.
- All S1-001 through S1-007 acceptance criteria continue to pass — no regression.

---

# Definition of Done

Restated from `07_ENGINEERING_WORKFLOW.md`: complete only when scope is implemented exactly as approved, no unauthorized changes were made, a completion report has been submitted, Architecture review has occurred, `09_PROJECT_BRAIN.md` has been updated, and the sprint has been formally closed. Implementation may not begin until this Brief is marked Approved.

---

# Risks

- **Premature methodology decision risk.** The temptation to prove the framework with "just one simple real Provider" would require deciding which methodology comes first — an Architecture Team scope decision this Brief deliberately does not make. Mitigated by using in-test-only fixture Providers instead (see Scope item 7, Non-Scope).
- **Provider Lifecycle × Computation Versioning risk.** `22_ANALYSIS_ENGINE_ARCHITECTURE.md`'s Finding B is still recorded as an open question in ADR-006 itself. It does not block this sprint (no real Provider exists to be deprecated yet), but must be resolved before S1-009 registers one — see Decisions Requiring Architecture Team Approval.
- **Circuit breaker over-eagerness risk.** A too-low failure threshold could exclude a genuinely healthy but momentarily slow Provider; a too-high threshold delays protection. Mitigated by disclosing the chosen threshold/reset values in a Decision Log entry (Missing Decisions) rather than burying them undocumented in code.

---

# Escalation Triggers

Per `07_ENGINEERING_WORKFLOW.md` and `10_AI_ENGINEER_GUIDE.md`, stop and escalate if:

- A new runtime or development dependency is required.
- Any change to `22_ANALYSIS_ENGINE_ARCHITECTURE.md` or ADR-005/006/007 is proposed or appears necessary.
- Implementing Provider Lifecycle gating turns out to require resolving Finding B (DEPRECATED vs. RETIRED `computationVersion` mutability) rather than merely defining the state field.
- Scope expansion is requested, including any request to implement a real methodology Provider, `normalize()`'s vocabulary, or Trace Store persistence (all explicitly Non-Scope).

---

# Missing Decisions (Acknowledged, Intentionally Deferred)

Calibration choices within ADR-006's already-approved design, resolved via a Decision Log entry at implementation time, per the DEC-2026-009/DEC-2026-011 precedent — not requiring pre-approval:

- Provider dependency-declaration syntax (the concrete shape of a token reference on a Provider's registration metadata).
- Fast-tier/slow-tier classification criteria (how a Provider declares which tier it belongs to).
- Circuit-breaker failure-threshold and reset-timeout default values.
- Confidence-label naming conventions and per-Provider multi-hypothesis bound (not exercised by fixtures unless needed to prove the contract shape, but the naming convention itself is an implementation-time choice).
- `computationVersion` numbering scheme for this layer (same semantic-versioning-from-`1.0.0` convention as S1-007, applied per Provider).

---

# Decisions Requiring Architecture Team Approval (Before Implementation)

These are not calibration values — they touch contract shape or a still-open architectural question, so they are proposed here for explicit sign-off rather than decided unilaterally:

1. **`normalize()`'s placeholder signature.** ADR-006 requires the method to exist; ADR-007 (S1-012) defines its real vocabulary and return shape. Proposal: declare `normalize(): void` for this sprint — a no-op stub satisfying "the method exists" without inventing any placeholder vocabulary type that ADR-007 would then need to supersede. Nothing calls `normalize()` in this sprint (Confluence, its only consumer, does not exist yet).
2. **Finding B (Provider Lifecycle × Computation Versioning) remains unresolved.** This sprint defines the `ACTIVE`/`DEPRECATED`/`RETIRED` state and its new-run participation gating only (unambiguous per architecture text); it will not implement any `computationVersion` mutability rule tied to lifecycle state, since no real Provider exists yet to exercise one. Request: confirm this narrower scope is acceptable, and that Finding B's resolution (the architecture doc's own recommendation: DEPRECATED may still increment for historical-accuracy corrections, RETIRED is frozen) will be settled before S1-009 registers the first real Provider.
3. **Trace Store non-persistence for this sprint.** Confirm that returning `traceability` as an in-memory field on Provider output — with no persistence layer, no new Prisma model, and no TTL/retention mechanics — is acceptable for S1-008, deferring actual storage to whichever of S1-009 or S1-012 first needs to retain a trace beyond a single request/response.

---

# Approval Section

- **Approval Status:**
  - [x] Proposed
  - [ ] Under Review
  - [ ] Approved
  - [ ] Rejected / Returned for Revision
- **Approved By:** *(pending)*
- **Date Approved:** *(pending)*

---

# Sprint Closure

- **Sprint Status:** NOT STARTED — Proposed, pending Architecture Team review and the three decisions above.
- **Closed Date:** *(pending)*
- **Completion Report:** *(pending)*
- **Final Implementation Commits:** *(pending)*
- **Related ADR:** ADR-006 (see `12_ADR_INDEX.md`)
- **Related Decisions:** *(pending)*

---

# Related Documents

- `documentation/zos/22_ANALYSIS_ENGINE_ARCHITECTURE.md` (Analysis Provider Framework, Evidence/Interpretation/Limitations Contract, Traceability, Trace Store, Confidence Model, Operational Resilience & Observability, Provider Lifecycle, Additional Findings B/C)
- `documentation/zos/12_ADR_INDEX.md` (ADR-006 — this sprint's governing decision; ADR-005 — the computation substrate a future Provider will consume; ADR-007 — scoped to S1-012)
- `documentation/zos/sprints/S1-007_SPRINT_BRIEF.md` (the computation substrate this framework's future Providers depend on)
- `documentation/zos/SPRINT_BRIEF_TEMPLATE.md`
- `documentation/zos/09_PROJECT_BRAIN.md`
- `documentation/zos/11_DECISION_LOG.md`
