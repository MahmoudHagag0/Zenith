import { ProviderRateLimitedError } from './providers/provider-errors';
import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterService', () => {
  it('allows requests up to the configured threshold within a window', () => {
    const limiter = new RateLimiterService();

    for (let i = 0; i < 20; i++) {
      expect(() => limiter.acquire()).not.toThrow();
    }
  });

  it('rejects a request once the threshold is exceeded within the same window', () => {
    const limiter = new RateLimiterService();

    for (let i = 0; i < 20; i++) {
      limiter.acquire();
    }

    expect(() => limiter.acquire()).toThrow(ProviderRateLimitedError);
  });

  it('allows requests again once the window has elapsed', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    try {
      const limiter = new RateLimiterService();
      for (let i = 0; i < 20; i++) {
        limiter.acquire();
      }
      expect(() => limiter.acquire()).toThrow(ProviderRateLimitedError);

      jest.setSystemTime(new Date('2026-01-01T00:00:01.100Z'));
      expect(() => limiter.acquire()).not.toThrow();
    } finally {
      jest.useRealTimers();
    }
  });
});
