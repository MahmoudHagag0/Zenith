import { Injectable } from '@nestjs/common';
import { ProviderRateLimitedError } from './providers/provider-errors';

const MAX_REQUESTS_PER_WINDOW = 20;
const WINDOW_MS = 1_000;

/**
 * Sliding-window rate limiter guarding calls into the registered
 * MarketDataProvider, independent of which provider is registered
 * (DEC-2026-006). Throws ProviderRateLimitedError once the limit is
 * exceeded within the current window; callers retry via withRetry().
 */
@Injectable()
export class RateLimiterService {
  private requestTimestamps: number[] = [];

  acquire(): void {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
    if (this.requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      throw new ProviderRateLimitedError();
    }
    this.requestTimestamps.push(now);
  }
}
