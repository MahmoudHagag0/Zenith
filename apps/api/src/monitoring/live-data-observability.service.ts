import { Injectable, Logger } from '@nestjs/common';
import type { LiveDataMetricsRecorder } from '../market-data/providers/live-data-metrics-recorder.interface';
import type { OperationalAlert, ProviderMetricsSnapshot, ProviderStatus, SyncMetricsSnapshot } from './live-data-observability.types';

interface ProviderState {
  domain: string;
  successCount: number;
  failureCount: number;
  totalLatencyMs: number;
  retryCount: number;
  rateLimitEvents: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  circuitOpen: boolean;
  // Explicit ordering flag rather than comparing lastSuccessAt/lastFailureAt
  // Dates -- two events recorded within the same millisecond (a realistic
  // occurrence, not just a test artifact) would otherwise be indistinguishable.
  lastOutcomeWasFailure: boolean;
}

interface SyncState {
  lastSyncAt: Date | null;
  lastSyncSucceeded: number;
  lastSyncFailed: number;
}

/** A provider is DEGRADED once at least this fraction of its recorded calls have failed. */
const DEGRADED_FAILURE_RATE_THRESHOLD = 0.5;
/** ...but only once there's a large-enough sample to make that rate meaningful. */
const MIN_SAMPLE_FOR_FAILURE_RATE_ALERT = 5;

/**
 * Dedicated Live Data observability service (L1-008,
 * 28_LIVE_DATA_BLUEPRINT.md §9 Phase 8, Architecture Team Decision 3) --
 * deliberately separate from the Analysis Engine's `ObservabilityService`
 * (S1-007), which tracks pure computations/Provider invocations for a
 * different domain and whose failure-detection is keyed to
 * `ComputationRejectedError`, a type Live Data providers never throw.
 *
 * All metrics are derived from calls `MarketDataHttpClient` and each
 * domain's `*SyncService` were already making (Architecture Team
 * Decision 2 — passive health monitoring only; this service never
 * initiates a network call of its own).
 */
@Injectable()
export class LiveDataObservabilityService implements LiveDataMetricsRecorder {
  private readonly logger = new Logger(LiveDataObservabilityService.name);
  private readonly providers = new Map<string, ProviderState>();
  private readonly syncs = new Map<string, SyncState>();

  private providerState(providerId: string, domain: string): ProviderState {
    let state = this.providers.get(providerId);
    if (!state) {
      state = {
        domain,
        successCount: 0,
        failureCount: 0,
        totalLatencyMs: 0,
        retryCount: 0,
        rateLimitEvents: 0,
        lastSuccessAt: null,
        lastFailureAt: null,
        circuitOpen: false,
        lastOutcomeWasFailure: false,
      };
      this.providers.set(providerId, state);
    }
    return state;
  }

  recordCircuitState(providerId: string, domain: string, isOpen: boolean): void {
    this.providerState(providerId, domain).circuitOpen = isOpen;
  }

  recordSuccess(providerId: string, domain: string, latencyMs: number): void {
    const state = this.providerState(providerId, domain);
    state.successCount += 1;
    state.totalLatencyMs += latencyMs;
    state.lastSuccessAt = new Date();
    state.lastOutcomeWasFailure = false;
  }

  recordFailure(providerId: string, domain: string, latencyMs: number, rateLimited: boolean): void {
    const state = this.providerState(providerId, domain);
    state.failureCount += 1;
    state.totalLatencyMs += latencyMs;
    state.lastFailureAt = new Date();
    state.lastOutcomeWasFailure = true;
    if (rateLimited) {
      state.rateLimitEvents += 1;
      this.logger.warn(`Rate limit event: provider=${providerId} domain=${domain}`);
    }
  }

  recordRetry(providerId: string, domain: string): void {
    this.providerState(providerId, domain).retryCount += 1;
  }

  /** Called by each domain's `*SyncService` once per cron run (Architecture Team Decision 2 — "Sync history"). */
  recordSync(domain: string, succeeded: number, failed: number): void {
    this.syncs.set(domain, { lastSyncAt: new Date(), lastSyncSucceeded: succeeded, lastSyncFailed: failed });
    if (failed > 0) {
      this.logger.warn(`Sync failures observed: domain=${domain} succeeded=${succeeded} failed=${failed}`);
    }
  }

  getProviderSnapshots(): ProviderMetricsSnapshot[] {
    return Array.from(this.providers.entries()).map(([providerId, state]) => this.toSnapshot(providerId, state));
  }

  getSyncSnapshots(): SyncMetricsSnapshot[] {
    return Array.from(this.syncs.entries()).map(([domain, state]) => ({ domain, ...state }));
  }

  /**
   * Documented alert thresholds (Architecture Team Decision 1 —
   * Operational Alerting only, computed on read from already-tracked
   * runtime state; no persisted incident record, no outbound
   * notification channel, no connection to the unrelated user-facing
   * `Alert`/`AlertsService` domain):
   * - CRITICAL: a provider's circuit breaker is open.
   * - WARN: a provider's failure rate is >= 50% over at least 5 recorded calls.
   * - WARN: a provider has any recorded rate-limit event.
   * - WARN: a domain's most recent sync run had at least one failure.
   */
  getAlerts(): OperationalAlert[] {
    const alerts: OperationalAlert[] = [];

    for (const [providerId, state] of this.providers.entries()) {
      if (state.circuitOpen) {
        alerts.push({ providerId, domain: state.domain, severity: 'CRITICAL', reason: 'Circuit breaker is open' });
        continue;
      }
      const total = state.successCount + state.failureCount;
      if (total >= MIN_SAMPLE_FOR_FAILURE_RATE_ALERT && state.failureCount / total >= DEGRADED_FAILURE_RATE_THRESHOLD) {
        alerts.push({
          providerId,
          domain: state.domain,
          severity: 'WARN',
          reason: `High error rate: ${state.failureCount}/${total} calls failed`,
        });
      }
      if (state.rateLimitEvents > 0) {
        alerts.push({ providerId, domain: state.domain, severity: 'WARN', reason: `${state.rateLimitEvents} rate limit event(s) observed` });
      }
    }

    for (const [domain, state] of this.syncs.entries()) {
      if (state.lastSyncFailed > 0) {
        alerts.push({
          providerId: domain,
          domain,
          severity: 'WARN',
          reason: `Last sync had ${state.lastSyncFailed} failure(s) (${state.lastSyncSucceeded} succeeded)`,
        });
      }
    }

    return alerts;
  }

  private toSnapshot(providerId: string, state: ProviderState): ProviderMetricsSnapshot {
    return {
      providerId,
      domain: state.domain,
      status: this.deriveStatus(state),
      successCount: state.successCount,
      failureCount: state.failureCount,
      averageLatencyMs: state.successCount + state.failureCount === 0 ? 0 : state.totalLatencyMs / (state.successCount + state.failureCount),
      retryCount: state.retryCount,
      rateLimitEvents: state.rateLimitEvents,
      lastSuccessAt: state.lastSuccessAt,
      lastFailureAt: state.lastFailureAt,
      circuitOpen: state.circuitOpen,
    };
  }

  /** Derived purely from already-tracked runtime state (Architecture Team Decision 2) -- never a live ping. */
  private deriveStatus(state: ProviderState): ProviderStatus {
    if (state.circuitOpen) return 'DOWN';
    if (state.successCount === 0 && state.failureCount === 0) return 'UNKNOWN';
    return state.lastOutcomeWasFailure ? 'DEGRADED' : 'UP';
  }

  /** Test-only helper; not part of the production surface. */
  reset(): void {
    this.providers.clear();
    this.syncs.clear();
  }
}
