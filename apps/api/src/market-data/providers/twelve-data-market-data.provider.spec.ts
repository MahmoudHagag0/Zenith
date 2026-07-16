import { TwelveDataMarketDataProvider } from './twelve-data-market-data.provider';
import { ProviderUnavailableError } from './provider-errors';

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('TwelveDataMarketDataProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('exposes "twelve-data" as its provider name', () => {
    expect(new TwelveDataMarketDataProvider('test-key').name).toBe('twelve-data');
  });

  it('getQuote() calls the /quote endpoint with the symbol and API key, and normalizes the response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse(200, { symbol: 'AAPL', currency: 'USD', close: '182.52', timestamp: 1_704_135_600 }));
    const provider = new TwelveDataMarketDataProvider('test-key');

    const quote = await provider.getQuote('AAPL');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/api\.twelvedata\.com\/quote\?symbol=AAPL&apikey=test-key$/),
      expect.anything(),
    );
    expect(quote).toEqual({ symbol: 'AAPL', price: 182.52, currency: 'USD', asOf: new Date(1_704_135_600 * 1000) });
  });

  it('getCandles() calls the /time_series endpoint with the requested date range and normalizes the response', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(200, {
        meta: { symbol: 'AAPL', currency: 'USD' },
        values: [{ datetime: '2026-01-02', open: '10', high: '12', low: '9', close: '11', volume: '1000' }],
      }),
    );
    const provider = new TwelveDataMarketDataProvider('test-key');

    const candles = await provider.getCandles('AAPL', new Date('2026-01-01'), new Date('2026-01-02'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(
        /^https:\/\/api\.twelvedata\.com\/time_series\?symbol=AAPL&interval=1day&start_date=2026-01-01&end_date=2026-01-02&apikey=test-key$/,
      ),
      expect.anything(),
    );
    expect(candles).toEqual([{ date: new Date('2026-01-02'), open: 10, high: 12, low: 9, close: 11, volume: 1000 }]);
  });

  it('throws ProviderUnavailableError when Twelve Data returns HTTP 200 with an error-shaped body (e.g. invalid symbol)', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { code: 400, message: 'Invalid symbol', status: 'error' }));
    const provider = new TwelveDataMarketDataProvider('test-key');

    await expect(provider.getQuote('NOT-A-REAL-SYMBOL')).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('checkHealth() calls the low-cost /api_usage endpoint rather than /quote', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { current_usage: 12, plan_limit: 800 }));
    const provider = new TwelveDataMarketDataProvider('test-key');

    const status = await provider.checkHealth();

    expect(status).toBe('UP');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api_usage?apikey=test-key'), expect.anything());
  });

  it('checkHealth() reports DOWN rather than throwing when the provider is unreachable', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(500, { message: 'down' }));
    const provider = new TwelveDataMarketDataProvider('test-key');

    await expect(provider.checkHealth()).resolves.toBe('DOWN');
  });

  it('percent-encodes symbols containing special characters (e.g. forex pairs)', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse(200, { symbol: 'EUR/USD', currency: 'USD', close: '1.0950', datetime: '2026-01-01' }));
    const provider = new TwelveDataMarketDataProvider('test-key');

    await provider.getQuote('EUR/USD');

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('symbol=EUR%2FUSD'), expect.anything());
  });
});
