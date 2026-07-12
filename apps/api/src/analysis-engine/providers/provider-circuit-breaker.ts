/**
 * Per-Provider circuit breaker (ADR-006, "Analysis Provider Framework" —
 * Circuit Breaker; reusing ADR-003's retry/backoff philosophy for
 * in-process invocation rather than an external vendor call). A Provider
 * failing or timing out repeatedly is excluded from invocation (open
 * circuit) rather than re-invoked on every request; it becomes eligible
 * again only after `resetTimeoutMs` has elapsed, at which point the next
 * call is allowed through as a probe — closing the circuit on success,
 * reopening it on failure.
 *
 * `failureThreshold`/`resetTimeoutMs` are implementation-time calibration
 * values (S1-008 Sprint Brief, Missing Decisions), not fixed by ADR-006.
 */
export interface ProviderCircuitBreakerConfig {
  readonly failureThreshold: number;
  readonly resetTimeoutMs: number;
}

interface BreakerState {
  consecutiveFailures: number;
  openedAt: number | null;
}

export class ProviderCircuitBreaker {
  private readonly states = new Map<string, BreakerState>();

  constructor(private readonly config: ProviderCircuitBreakerConfig) {}

  private stateFor(providerId: string): BreakerState {
    let state = this.states.get(providerId);
    if (!state) {
      state = { consecutiveFailures: 0, openedAt: null };
      this.states.set(providerId, state);
    }
    return state;
  }

  /**
   * Whether this Provider must be skipped (circuit open and reset timeout
   * not yet elapsed). Once the reset timeout elapses, the circuit allows
   * one probe attempt through — `recordFailure`/`recordSuccess` then
   * decide whether it reopens or closes.
   */
  isOpen(providerId: string, now: number = Date.now()): boolean {
    const state = this.stateFor(providerId);
    if (state.openedAt === null) return false;
    return now - state.openedAt < this.config.resetTimeoutMs;
  }

  recordSuccess(providerId: string): void {
    const state = this.stateFor(providerId);
    state.consecutiveFailures = 0;
    state.openedAt = null;
  }

  recordFailure(providerId: string, now: number = Date.now()): void {
    const state = this.stateFor(providerId);
    state.consecutiveFailures += 1;
    if (state.consecutiveFailures >= this.config.failureThreshold) {
      state.openedAt = now;
    }
  }

  /** Test/observability helper — not part of the invocation decision path. */
  getState(providerId: string): { readonly consecutiveFailures: number; readonly isOpen: boolean } {
    const state = this.stateFor(providerId);
    return { consecutiveFailures: state.consecutiveFailures, isOpen: this.isOpen(providerId) };
  }
}
