import { LiveCotProvider } from './live-cot.provider';

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('LiveCotProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('exposes "cftc" as its provider name', () => {
    expect(new LiveCotProvider().name).toBe('cftc');
  });

  it('returns an empty array without calling the CFTC API for a symbol with no contract mapping', async () => {
    global.fetch = jest.fn();
    const provider = new LiveCotProvider();

    const reports = await provider.getLatestReports('NOT-A-MAPPED-SYMBOL');

    expect(reports).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('queries the CFTC Socrata endpoint by the mapped contract code and normalizes the response', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(200, [
        {
          report_date_as_yyyy_mm_dd: '2026-07-14T00:00:00.000',
          comm_positions_long_all: '60000',
          comm_positions_short_all: '55000',
          noncomm_positions_long_all: '40000',
          noncomm_positions_short_all: '35000',
          nonrept_positions_long_all: '10000',
          nonrept_positions_short_all: '9000',
        },
      ]),
    );
    const provider = new LiveCotProvider();

    const reports = await provider.getLatestReports('GOLD');

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('publicreporting.cftc.gov'), expect.anything());
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('cftc_contract_market_code%3D%27088691%27'), expect.anything());
    expect(reports).toHaveLength(3);
    expect(reports.map((r) => r.category).sort()).toEqual(['COMMERCIAL', 'NON_COMMERCIAL', 'NON_REPORTABLE']);
  });

  it('includes the optional app token as a query parameter when configured', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, []));
    const provider = new LiveCotProvider('test-app-token');

    await provider.getLatestReports('GOLD');

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('app_token=test-app-token'), expect.anything());
  });

  it('does not include an app token query parameter when none is configured', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, []));
    const provider = new LiveCotProvider();

    await provider.getLatestReports('GOLD');

    expect(global.fetch).toHaveBeenCalledWith(expect.not.stringContaining('app_token'), expect.anything());
  });
});
