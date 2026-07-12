export interface RetryOptions {
  /** Number of retry attempts after the initial try (0 means no retries). */
  retries: number;
  /** Base delay in milliseconds; doubles after each attempt (exponential backoff). */
  baseDelayMs: number;
  /** Returns true if the error should be retried. Defaults to always retry. */
  isRetryable?: (error: unknown) => boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generic backoff-retry wrapper around a provider call. Distinguishes
 * retryable failures (rate-limited, transient provider unavailability)
 * from non-retryable ones — a non-retryable error propagates immediately
 * without consuming a retry attempt.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const isRetryable = options.isRetryable ?? (() => true);
  let attempt = 0;

  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error) || attempt >= options.retries) {
        throw error;
      }
      await sleep(options.baseDelayMs * 2 ** attempt);
      attempt += 1;
    }
  }
}
