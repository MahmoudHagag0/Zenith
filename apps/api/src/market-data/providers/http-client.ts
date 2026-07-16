import { ProviderCircuitBreaker } from '../../analysis-engine/providers/provider-circuit-breaker';
import { withRetry } from '../retry.util';
import { ProviderRateLimitedError, ProviderUnavailableError } from './provider-errors';

export interface MarketDataHttpClientOptions {
  readonly timeoutMs?: number;
  readonly retries?: number;
  readonly baseDelayMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 200;

/**
 * Shared, vendor-agnostic HTTP client for real market-data providers
 * (28_LIVE_DATA_BLUEPRINT.md §4.5/§4.6). Reuses the existing retry.util
 * exponential backoff (S1-005) and the existing Analysis Engine circuit
 * breaker (S1-008) rather than duplicating either — the circuit breaker's
 * failure mode ("a provider may be flaky; isolate it, don't cascade") is
 * identical whether the caller is an in-process AnalysisProvider or an
 * outbound HTTP call to a real vendor.
 *
 * A single overall request timeout is used (native `fetch`/AbortController
 * do not expose a separate connect-vs-total distinction without dropping to
 * Node's lower-level http/https modules); disclosed as a deliberate
 * simplification of the Blueprint's "5s connect / 10s total" framing, not a
 * silent deviation from it.
 */
export class MarketDataHttpClient {
  private readonly breaker: ProviderCircuitBreaker;

  constructor(
    private readonly providerId: string,
    breakerConfig = { failureThreshold: 5, resetTimeoutMs: 60_000 },
  ) {
    this.breaker = new ProviderCircuitBreaker(breakerConfig);
  }

  async fetchJson(url: string, options: MarketDataHttpClientOptions = {}): Promise<unknown> {
    if (this.breaker.isOpen(this.providerId)) {
      throw new ProviderUnavailableError(`${this.providerId} circuit is open`);
    }

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    try {
      const result = await withRetry(() => this.performRequest(url, timeoutMs), {
        retries: options.retries ?? DEFAULT_RETRIES,
        baseDelayMs: options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS,
        isRetryable: (error) => error instanceof ProviderRateLimitedError || error instanceof ProviderUnavailableError,
      });
      this.breaker.recordSuccess(this.providerId);
      return result;
    } catch (error) {
      this.breaker.recordFailure(this.providerId);
      throw error;
    }
  }

  private async performRequest(url: string, timeoutMs: number): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.status === 429) {
        throw new ProviderRateLimitedError(`${this.providerId} rate limit exceeded`);
      }
      if (!response.ok) {
        throw new ProviderUnavailableError(`${this.providerId} responded with status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ProviderRateLimitedError || error instanceof ProviderUnavailableError) {
        throw error;
      }
      // Native fetch aborts with a DOMException, which — unlike most runtime
      // errors — does not extend Error in Node, so this check must not
      // require `instanceof Error` or a real timeout would fall through
      // unconverted.
      if (error && typeof error === 'object' && (error as { name?: unknown }).name === 'AbortError') {
        throw new ProviderUnavailableError(`${this.providerId} request timed out after ${timeoutMs}ms`);
      }
      // Any other failure — DNS resolution failure, connection refused,
      // blocked/unreachable host, TLS failure — degrades to
      // ProviderUnavailableError rather than letting a raw, unmapped
      // exception escape the Provider Abstraction (28_LIVE_DATA_BLUEPRINT.md
      // §4.6/§7, Failure Isolation).
      const message = error instanceof Error ? error.message : String(error);
      throw new ProviderUnavailableError(`${this.providerId} request failed: ${message}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
