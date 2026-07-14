/**
 * Per-Provider aggregate health signal (participation rate, average
 * confidence, failure rate over a rolling window), reusing
 * `MarketDataProvider.checkHealth()`'s UP/DOWN precedent shape (ADR-003),
 * applied here to Analysis Providers rather than a market-data vendor
 * (22_ANALYSIS_ENGINE_ARCHITECTURE.md, "Operational Resilience &
 * Observability" — Provider health).
 *
 * Only genuine invocation attempts (the Provider actually ran and either
 * succeeded or failed/timed out) are recorded here — a skip without
 * invocation (circuit already open, lifecycle-excluded, an unresolved
 * dependency) is not a new failure of the Provider itself and is not fed
 * into this rolling window.
 */

export type ProviderHealthStatus = 'UP' | 'DOWN';

interface Outcome {
  readonly succeeded: boolean;
  readonly confidence: number | null;
}

export interface ProviderHealthSignal {
  readonly status: ProviderHealthStatus;
  readonly participationRate: number;
  readonly averageConfidence: number | null;
  readonly failureRate: number;
  readonly sampleSize: number;
}

export class ProviderHealthTracker {
  private readonly windows = new Map<string, Outcome[]>();

  constructor(private readonly windowSize = 20) {}

  private windowFor(providerId: string): Outcome[] {
    let window = this.windows.get(providerId);
    if (!window) {
      window = [];
      this.windows.set(providerId, window);
    }
    return window;
  }

  recordAttempt(providerId: string, succeeded: boolean, confidence: number | null = null): void {
    const window = this.windowFor(providerId);
    window.push({ succeeded, confidence });
    if (window.length > this.windowSize) {
      window.shift();
    }
  }

  /** `circuitOpen` is supplied by the caller (the Execution Engine composes this with its own ProviderCircuitBreaker) rather than duplicated here. */
  getSignal(providerId: string, circuitOpen: boolean): ProviderHealthSignal {
    const window = this.windows.get(providerId) ?? [];
    if (window.length === 0) {
      return { status: circuitOpen ? 'DOWN' : 'UP', participationRate: 0, averageConfidence: null, failureRate: 0, sampleSize: 0 };
    }
    const succeededCount = window.filter((o) => o.succeeded).length;
    const confidences = window.filter((o) => o.confidence !== null).map((o) => o.confidence as number);
    const participationRate = succeededCount / window.length;
    const failureRate = 1 - participationRate;
    return {
      status: circuitOpen ? 'DOWN' : 'UP',
      participationRate,
      averageConfidence: confidences.length > 0 ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length : null,
      failureRate,
      sampleSize: window.length,
    };
  }
}
