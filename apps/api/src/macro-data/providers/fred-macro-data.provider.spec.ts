import { FredMacroDataProvider } from './fred-macro-data.provider';

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('FredMacroDataProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('exposes "fred" as its provider name', () => {
    expect(new FredMacroDataProvider('test-key').name).toBe('fred');
  });

  it('queries the FRED series/observations endpoint for the latest observation and normalizes it', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(200, { observations: [{ date: '2026-06-01', value: '5.33' }] }),
    );
    const provider = new FredMacroDataProvider('test-key');

    const value = await provider.getLatestSeriesValue('FEDFUNDS');

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api.stlouisfed.org/fred/series/observations'), expect.anything());
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('series_id=FEDFUNDS'), expect.anything());
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api_key=test-key'), expect.anything());
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('sort_order=desc'), expect.anything());
    expect(value).toEqual({
      seriesId: 'FEDFUNDS',
      observationDate: new Date('2026-06-01'),
      value: 5.33,
      raw: { date: '2026-06-01', value: '5.33' },
    });
  });

  it('returns null when FRED returns no observations for a series', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { observations: [] }));
    const provider = new FredMacroDataProvider('test-key');

    const value = await provider.getLatestSeriesValue('FEDFUNDS');

    expect(value).toBeNull();
  });

  it('returns null for a not-yet-published observation rather than propagating a fabricated value', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(200, { observations: [{ date: '2026-06-01', value: '.' }] }),
    );
    const provider = new FredMacroDataProvider('test-key');

    const value = await provider.getLatestSeriesValue('FEDFUNDS');

    expect(value).toBeNull();
  });
});
