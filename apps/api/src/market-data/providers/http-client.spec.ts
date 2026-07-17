import { MarketDataHttpClient } from './http-client';
import { ProviderRateLimitedError, ProviderUnavailableError } from './provider-errors';

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('MarketDataHttpClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns the parsed JSON body on a successful request', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { hello: 'world' }));
    const client = new MarketDataHttpClient('test-provider');

    const result = await client.fetchJson('https://example.test/quote');

    expect(result).toEqual({ hello: 'world' });
  });

  it('retries a 429 response and eventually succeeds', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, { message: 'rate limited' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const client = new MarketDataHttpClient('test-provider');

    const result = await client.fetchJson('https://example.test/quote', { baseDelayMs: 1 });

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws ProviderRateLimitedError once retries are exhausted on repeated 429s', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(429, { message: 'still limited' }));
    const client = new MarketDataHttpClient('test-provider');

    await expect(client.fetchJson('https://example.test/quote', { retries: 1, baseDelayMs: 1 })).rejects.toBeInstanceOf(
      ProviderRateLimitedError,
    );
  });

  it('throws ProviderUnavailableError for a non-2xx, non-429 status', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(500, { message: 'server error' }));
    const client = new MarketDataHttpClient('test-provider');

    await expect(client.fetchJson('https://example.test/quote', { retries: 0 })).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('converts a raw network failure (blocked host, DNS failure, connection refused) into ProviderUnavailableError rather than letting it escape unmapped', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));
    const client = new MarketDataHttpClient('test-provider');

    await expect(client.fetchJson('https://example.test/quote', { retries: 0 })).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('opens the circuit after enough consecutive failures and short-circuits further calls without invoking fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(500, { message: 'down' }));
    const client = new MarketDataHttpClient('test-provider', { failureThreshold: 2, resetTimeoutMs: 60_000 });

    await expect(client.fetchJson('https://example.test/quote', { retries: 0 })).rejects.toBeInstanceOf(ProviderUnavailableError);
    await expect(client.fetchJson('https://example.test/quote', { retries: 0 })).rejects.toBeInstanceOf(ProviderUnavailableError);
    const callsBeforeOpen = (global.fetch as jest.Mock).mock.calls.length;

    await expect(client.fetchJson('https://example.test/quote', { retries: 0 })).rejects.toBeInstanceOf(ProviderUnavailableError);

    expect((global.fetch as jest.Mock).mock.calls.length).toBe(callsBeforeOpen);
  });

  it('aborts and throws ProviderUnavailableError when the request exceeds the configured timeout', async () => {
    global.fetch = jest.fn().mockImplementation(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    const client = new MarketDataHttpClient('test-provider');

    await expect(client.fetchJson('https://example.test/quote', { timeoutMs: 5, retries: 0 })).rejects.toBeInstanceOf(
      ProviderUnavailableError,
    );
  });

  describe('passive metrics recording (L1-008)', () => {
    it('records circuit state and success on a successful call', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
      const metrics = { recordCircuitState: jest.fn(), recordSuccess: jest.fn(), recordFailure: jest.fn(), recordRetry: jest.fn() };
      const client = new MarketDataHttpClient('test-provider', undefined, 'test-domain', metrics);

      await client.fetchJson('https://example.test/quote');

      expect(metrics.recordCircuitState).toHaveBeenCalledWith('test-provider', 'test-domain', false);
      expect(metrics.recordSuccess).toHaveBeenCalledWith('test-provider', 'test-domain', expect.any(Number));
      expect(metrics.recordFailure).not.toHaveBeenCalled();
    });

    it('records failure with rateLimited=true on a 429', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(429, { message: 'rate limited' }));
      const metrics = { recordCircuitState: jest.fn(), recordSuccess: jest.fn(), recordFailure: jest.fn(), recordRetry: jest.fn() };
      const client = new MarketDataHttpClient('test-provider', undefined, 'test-domain', metrics);

      await expect(client.fetchJson('https://example.test/quote', { retries: 0 })).rejects.toBeInstanceOf(ProviderRateLimitedError);

      expect(metrics.recordFailure).toHaveBeenCalledWith('test-provider', 'test-domain', expect.any(Number), true);
    });

    it('records failure with rateLimited=false on a non-429 error', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(500, { message: 'down' }));
      const metrics = { recordCircuitState: jest.fn(), recordSuccess: jest.fn(), recordFailure: jest.fn(), recordRetry: jest.fn() };
      const client = new MarketDataHttpClient('test-provider', undefined, 'test-domain', metrics);

      await expect(client.fetchJson('https://example.test/quote', { retries: 0 })).rejects.toBeInstanceOf(ProviderUnavailableError);

      expect(metrics.recordFailure).toHaveBeenCalledWith('test-provider', 'test-domain', expect.any(Number), false);
    });

    it('records a retry via onRetry when a retryable failure is retried', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(jsonResponse(429, { message: 'rate limited' }))
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
      const metrics = { recordCircuitState: jest.fn(), recordSuccess: jest.fn(), recordFailure: jest.fn(), recordRetry: jest.fn() };
      const client = new MarketDataHttpClient('test-provider', undefined, 'test-domain', metrics);

      await client.fetchJson('https://example.test/quote', { baseDelayMs: 1 });

      expect(metrics.recordRetry).toHaveBeenCalledWith('test-provider', 'test-domain');
    });

    it('records circuit state as open once the circuit trips, without invoking recordSuccess/recordFailure again for the short-circuited call', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(500, { message: 'down' }));
      const metrics = { recordCircuitState: jest.fn(), recordSuccess: jest.fn(), recordFailure: jest.fn(), recordRetry: jest.fn() };
      const client = new MarketDataHttpClient(
        'test-provider',
        { failureThreshold: 1, resetTimeoutMs: 60_000 },
        'test-domain',
        metrics,
      );

      await expect(client.fetchJson('https://example.test/quote', { retries: 0 })).rejects.toBeInstanceOf(ProviderUnavailableError);
      await expect(client.fetchJson('https://example.test/quote', { retries: 0 })).rejects.toBeInstanceOf(ProviderUnavailableError);

      expect(metrics.recordCircuitState).toHaveBeenLastCalledWith('test-provider', 'test-domain', true);
    });

    it('falls back to the providerId as the domain label when no domain is supplied', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
      const metrics = { recordCircuitState: jest.fn(), recordSuccess: jest.fn(), recordFailure: jest.fn(), recordRetry: jest.fn() };
      const client = new MarketDataHttpClient('test-provider', undefined, undefined, metrics);

      await client.fetchJson('https://example.test/quote');

      expect(metrics.recordSuccess).toHaveBeenCalledWith('test-provider', 'test-provider', expect.any(Number));
    });
  });
});
