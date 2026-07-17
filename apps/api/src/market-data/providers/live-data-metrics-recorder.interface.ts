/**
 * Passive metrics sink for `MarketDataHttpClient` (L1-008,
 * 28_LIVE_DATA_BLUEPRINT.md §9 Phase 8, Architecture Team Decision 3).
 * Declared here, alongside its sole consumer, so `http-client.ts` never
 * depends on the concrete `LiveDataObservabilityService` or the
 * `monitoring` module that owns it — `LiveDataObservabilityService`
 * implements this interface instead. All calls are derived from requests
 * `MarketDataHttpClient` was already making; no method here triggers any
 * additional network call (Architecture Team Decision 2 — passive health
 * monitoring only).
 */
export interface LiveDataMetricsRecorder {
  /** Recorded once per `fetchJson()` call, before the circuit-open short-circuit check. */
  recordCircuitState(providerId: string, domain: string, isOpen: boolean): void;
  recordSuccess(providerId: string, domain: string, latencyMs: number): void;
  recordFailure(providerId: string, domain: string, latencyMs: number, rateLimited: boolean): void;
  recordRetry(providerId: string, domain: string): void;
}
