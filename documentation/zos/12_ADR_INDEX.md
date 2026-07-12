# 12_ADR_INDEX

**Document ID:** ZOS-012\
**Version:** 1.0.0\
**Status:** Living Document\
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

The ADR Index is the master catalog of all Architecture Decision Records
(ADRs) approved for the Zenith project.

## ADR Lifecycle

-   Proposed
-   Under Review
-   Approved
-   Superseded
-   Deprecated

## ADR Register

  ADR ID    Title                                   Status     Date         Related Sprint
  --------- --------------------------------------- ---------- ------------ ----------------
  ADR-001   JWT-Based Authentication (S1-001 Foundation)   Approved   2026-07-11   S1-001
  ADR-002   Argon2id Password Hashing (S1-002 User Management)   Approved   2026-07-12   S1-002
  ADR-003   Market Data Provider Abstraction (S1-005 Market Data Foundation)   Approved   2026-07-12   S1-005
  ADR-004   Background Job Scheduling for Market Data Synchronization (S1-005)   Approved   2026-07-12   S1-005

## ADR-001 — JWT-Based Authentication (S1-001 Foundation)

-   **Status:** Approved
-   **Context:** `documentation/zos/sprints/S1-001_SPRINT_BRIEF.md` Scope item 5 required a baseline authentication mechanism for `apps/api`, but no ADR previously established which mechanism was approved. `16_NAMING_CONVENTIONS.md` contained JWT-related naming examples suggesting, but not formally establishing, JWT.
-   **Decision:** S1-001's authentication foundation will use JWT-based authentication. Scope is limited to authentication foundation, authentication middleware/base services, and protected-route capability.
-   **Consequences:** `apps/api` implements JWT issuance/validation as its baseline authentication mechanism. No other authentication mechanism is authorized for S1-001.
-   **Alternatives Considered:** None recorded beyond the JWT naming precedent already present in `16_NAMING_CONVENTIONS.md`; no competing mechanism was proposed.
-   **Related Components:** `apps/api`.
-   **Related Decision Log Entry:** DEC-2026-001.

Explicitly out of scope under this ADR: OAuth providers, social login, advanced identity management, and any authentication complexity beyond this baseline. Introducing any of these requires a superseding ADR.

## ADR-002 — Argon2id Password Hashing (S1-002 User Management)

-   **Status:** Approved
-   **Context:** S1-002 introduces the first real `User` domain model and self-registration/login, requiring a password-hashing mechanism. No ZOS document previously specified one, and `04_TECH_STACK.md` does not list a hashing library.
-   **Decision:** User passwords are hashed with Argon2id. No other hashing algorithm (e.g. bcrypt, scrypt, plain SHA) is authorized for S1-002.
-   **Consequences:** `apps/api`'s registration/login flow depends on an Argon2id-capable library (subject to `14_DEPENDENCY_POLICY.md` review at implementation time). Password hashes are never logged or exposed via API responses.
-   **Alternatives Considered:** None recorded beyond the Architecture Team's direct selection of Argon2id; no competing algorithm was proposed for evaluation.
-   **Related Components:** `apps/api`, `packages/database` (`User.passwordHash`).
-   **Related Decision Log Entry:** DEC-2026-003.

## ADR-003 — Market Data Provider Abstraction (S1-005 Market Data Foundation)

-   **Status:** Approved
-   **Context:** S1-005 requires Zenith to source quotes and historical candles for catalog assets. `04_TECH_STACK.md` does not list any market-data vendor, and no external paid or free market-data service has been reviewed or approved by the Architecture Team. Constitution Rule 1 (no undocumented architecture) prohibits silently integrating an unapproved external dependency, and the Sprint's own instructions explicitly disallow external paid services unless already approved. At the same time, the product goal requires a real, working market-data foundation now, not a stalled sprint waiting on a future vendor-selection decision.
-   **Decision:** Market data is sourced through a `MarketDataProvider` interface (`getQuote`, `getCandles`, `checkHealth`), so that `apps/api`'s business logic (caching, rate limiting, retry, background sync, the HTTP API) depends only on this interface, never on a concrete vendor. The only implementation shipped in this sprint is a `SimulatedMarketDataProvider` — a deterministic, in-process generator of quotes and candles (seeded by asset symbol and time bucket, not random), clearly labeled in code and documentation as simulated, not real market data. No real external market-data vendor is integrated by this decision.
-   **Consequences:** Every quote and candle returned by S1-005's API is simulated, not a real market price, until a future ADR selects and integrates a real vendor behind this same interface — at which point only a new `MarketDataProvider` implementation and its module registration change; caching, rate limiting, retry, background sync, and the HTTP API are unaffected. This is a deliberate, transparent placeholder, not a claim of real market data.
-   **Alternatives Considered:** (1) Integrate a free, no-API-key public market-data endpoint directly — rejected because no such vendor has been reviewed or approved by the Architecture Team, and doing so without that review would be an undocumented architecture change and an unapproved external dependency. (2) Defer the entire sprint until a vendor is approved — rejected because the caching, retry, rate-limiting, background-sync, and API-surface foundation this sprint builds is valuable and testable independent of which provider eventually supplies real data, and building it now against a stable interface directly enables a future vendor swap with no business-logic change.
-   **Related Components:** `apps/api/src/market-data` (provider interface and `SimulatedMarketDataProvider`).
-   **Related Decision Log Entry:** DEC-2026-006.

Explicitly out of scope under this ADR: selecting or integrating any real external market-data vendor. Introducing one requires a superseding or additional ADR at the time a vendor is actually reviewed and approved.

## ADR-004 — Background Job Scheduling for Market Data Synchronization (S1-005)

-   **Status:** Approved
-   **Context:** S1-005 requires periodic background synchronization of market data for assets traders actually track (watchlisted, favourited, or held), so cached quotes do not silently go stale between requests. No prior sprint introduced any background/scheduled job execution capability, and `04_TECH_STACK.md` does not list a scheduling mechanism.
-   **Decision:** Background synchronization uses `@nestjs/schedule`, the official NestJS scheduling module, via its `@Cron()` decorator. No other scheduling mechanism (custom `setInterval` loops, an external job queue, a separate worker process) is authorized for this sprint.
-   **Consequences:** `apps/api` gains a `MarketDataSyncService` that periodically refreshes cached quotes for tracked assets only (not the entire catalog), respecting the same rate limiter and retry logic as on-demand requests. `@nestjs/schedule` becomes a new runtime dependency, reviewed under `14_DEPENDENCY_POLICY.md` at implementation time (official NestJS-maintained package, no license concern, minimal footprint, no overlapping existing dependency).
-   **Alternatives Considered:** An external job queue (e.g. BullMQ with Redis) was considered and rejected as disproportionate to this sprint's needs and would introduce a new infrastructure dependency (Redis) not present in `04_TECH_STACK.md`; a hand-rolled `setInterval` loop was considered and rejected because it duplicates functionality `@nestjs/schedule` already provides as a maintained, officially-supported NestJS module, contrary to `04_TECH_STACK.md`'s "prefer official libraries" rule.
-   **Related Components:** `apps/api/src/market-data` (`MarketDataSyncService`).
-   **Related Decision Log Entry:** DEC-2026-007.

## ADR Template

-   ADR ID
-   Title
-   Status
-   Context
-   Decision
-   Consequences
-   Alternatives Considered
-   Related Components
-   Related Decision Log Entry

## Governance

-   Every architectural decision requires an ADR.
-   ADRs are immutable after approval except through a superseding ADR.
-   The Architecture Team owns the ADR process.

## Related Documents

-   05_ARCHITECTURE.md
-   11_DECISION_LOG.md
-   09_PROJECT_BRAIN.md
