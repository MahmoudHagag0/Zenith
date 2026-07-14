import { Injectable } from '@nestjs/common';

// Implementation-time calibration (not an architectural decision, analogous
// to DEC-2026-008's TTL precedent): 60s keeps output caching effective
// within a single burst of related computations without serving results
// stale enough to matter for daily-bar analysis.
const DEFAULT_TTL_MS = 60_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Shared output cache for Indicator Engine / Swing Detection / Regime
 * Context computations, keyed by (computation, parameters, instrument,
 * data-range), per ADR-005 and 22_ANALYSIS_ENGINE_ARCHITECTURE.md. This is
 * an in-process cache (no new runtime dependency) distinct from — and
 * layered on top of — MarketDataService's own S1-005 caching of raw market
 * data rows, and distinct from the request-scoped `MarketSeries`
 * translation sharing described in the Sprint Brief; this cache holds
 * computed *outputs*, not raw market data or translated series.
 */
@Injectable()
export class ComputationCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;

  buildKey(
    computation: string,
    parameters: Record<string, unknown>,
    instrument: string,
    dataRange: { from: string | null; to: string | null },
  ): string {
    return JSON.stringify({ computation, parameters, instrument, dataRange });
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      if (entry) this.store.delete(key);
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Cache hit ratio observability signal, per "Operational Resilience & Observability". */
  getStats(): { hits: number; misses: number; hitRatio: number } {
    const total = this.hits + this.misses;
    return { hits: this.hits, misses: this.misses, hitRatio: total === 0 ? 0 : this.hits / total };
  }

  /** Test-only helper; not part of the production surface. */
  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }
}
