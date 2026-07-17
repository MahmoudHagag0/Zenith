import { FinnhubCorporateActionsProvider } from './finnhub-corporate-actions.provider';

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('FinnhubCorporateActionsProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('exposes "finnhub" as its provider name', () => {
    expect(new FinnhubCorporateActionsProvider('test-key').name).toBe('finnhub');
  });

  it('queries the Finnhub /stock/split endpoint and normalizes the response', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, [{ date: '2026-06-01', fromFactor: 1, toFactor: 2 }]));
    const provider = new FinnhubCorporateActionsProvider('test-key');

    const splits = await provider.getSplits('ZEN');

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('finnhub.io/api/v1/stock/split'), expect.anything());
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('symbol=ZEN'), expect.anything());
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('token=test-key'), expect.anything());
    expect(splits).toEqual([{ effectiveDate: new Date('2026-06-01'), ratio: 2, raw: { date: '2026-06-01', fromFactor: 1, toFactor: 2 } }]);
  });

  it('queries the Finnhub /stock/dividend endpoint and normalizes the response', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, [{ date: '2026-06-01', amount: 0.24, currency: 'USD' }]));
    const provider = new FinnhubCorporateActionsProvider('test-key');

    const dividends = await provider.getDividends('ZEN');

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('finnhub.io/api/v1/stock/dividend'), expect.anything());
    expect(dividends).toEqual([
      { effectiveDate: new Date('2026-06-01'), amount: 0.24, currency: 'USD', raw: { date: '2026-06-01', amount: 0.24, currency: 'USD' } },
    ]);
  });

  it('filters out unparseable events rather than propagating a null', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, [{ date: 'not-a-date', fromFactor: 1, toFactor: 2 }]));
    const provider = new FinnhubCorporateActionsProvider('test-key');

    const splits = await provider.getSplits('ZEN');

    expect(splits).toEqual([]);
  });
});
