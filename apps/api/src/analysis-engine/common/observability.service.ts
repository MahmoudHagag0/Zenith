import { Injectable, Logger } from '@nestjs/common';

interface ComputationStats {
  invocations: number;
  totalLatencyMs: number;
  rejections: number;
}

/**
 * Per-computation observability: latency and computation-rejection-rate,
 * per "Operational Resilience & Observability" in
 * 22_ANALYSIS_ENGINE_ARCHITECTURE.md. Cache hit ratio is reported directly
 * by ComputationCacheService.getStats(); this service covers the two
 * remaining required signals for pure computations. Uses the existing Nest
 * `Logger` (backed by nestjs-pino, per `04_TECH_STACK.md`/AppModule) — no
 * new metrics/tracing dependency is introduced.
 *
 * "Failure rate" (per Provider-level, ADR-006) does not apply here: a
 * deterministic pure function cannot fail on valid input. An unhandled
 * exception is always a defect, never an accepted operational metric —
 * only recognized, typed rejections (ComputationRejectedError) are
 * counted.
 */
@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);
  private readonly stats = new Map<string, ComputationStats>();

  private statsFor(computation: string): ComputationStats {
    let entry = this.stats.get(computation);
    if (!entry) {
      entry = { invocations: 0, totalLatencyMs: 0, rejections: 0 };
      this.stats.set(computation, entry);
    }
    return entry;
  }

  recordLatency(computation: string, latencyMs: number): void {
    const entry = this.statsFor(computation);
    entry.invocations += 1;
    entry.totalLatencyMs += latencyMs;
    this.logger.debug(`${computation} computed in ${latencyMs.toFixed(2)}ms`);
  }

  recordRejection(computation: string, reason: string): void {
    const entry = this.statsFor(computation);
    entry.rejections += 1;
    this.logger.warn(`${computation} rejected input: ${reason}`);
  }

  getStats(computation: string): { invocations: number; averageLatencyMs: number; rejectionRate: number } {
    const entry = this.stats.get(computation);
    if (!entry || entry.invocations === 0) {
      return { invocations: 0, averageLatencyMs: 0, rejectionRate: 0 };
    }
    return {
      invocations: entry.invocations,
      averageLatencyMs: entry.totalLatencyMs / entry.invocations,
      rejectionRate: entry.rejections / entry.invocations,
    };
  }

  /**
   * Wraps a computation, recording latency always and rejection when the
   * computation throws `ComputationRejectedError`-shaped errors (detected
   * structurally via `name` to avoid an import cycle with the error class).
   */
  measure<T>(computation: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } catch (error) {
      if (error instanceof Error && error.name === 'ComputationRejectedError') {
        this.recordRejection(computation, error.message);
      }
      throw error;
    } finally {
      this.recordLatency(computation, performance.now() - start);
    }
  }

  /**
   * Async counterpart to `measure()`, for Provider invocation (S1-008),
   * which is inherently asynchronous — a Provider's `analyze()` composes
   * `MarketSeriesService`, itself backed by the database. Records latency
   * and rejection identically to the synchronous form.
   */
  async measureAsync<T>(computation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error && error.name === 'ComputationRejectedError') {
        this.recordRejection(computation, error.message);
      }
      throw error;
    } finally {
      this.recordLatency(computation, performance.now() - start);
    }
  }

  /** Test-only helper; not part of the production surface. */
  reset(): void {
    this.stats.clear();
  }
}
