import { TwelveDataInstrumentMetadataProvider } from './twelve-data-instrument-metadata.provider';
import { ProviderUnavailableError } from './provider-errors';

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('TwelveDataInstrumentMetadataProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('exposes "twelve-data" as its provider name', () => {
    expect(new TwelveDataInstrumentMetadataProvider('test-key').name).toBe('twelve-data');
  });

  describe('searchSymbols', () => {
    it('calls the /symbol_search endpoint and normalizes the response', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse(200, { data: [{ symbol: 'TSLA', instrument_name: 'Tesla Inc.', exchange: 'NASDAQ' }] }));
      const provider = new TwelveDataInstrumentMetadataProvider('test-key');

      const results = await provider.searchSymbols('TSLA');

      expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/api\.twelvedata\.com\/symbol_search\?symbol=TSLA&apikey=test-key$/), expect.anything());
      expect(results).toEqual([{ symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' }]);
    });
  });

  describe('getInstrumentMetadata', () => {
    it('calls the /quote endpoint and normalizes the response', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD' }));
      const provider = new TwelveDataInstrumentMetadataProvider('test-key');

      const metadata = await provider.getInstrumentMetadata('AAPL');

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/quote?symbol=AAPL&apikey=test-key'), expect.anything());
      expect(metadata).toEqual({ symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', tickSize: 0.01, lotSize: 1 });
    });
  });

  describe('getExchangeMetadata', () => {
    it('calls the /exchanges endpoint and normalizes the matching row', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, [{ code: 'NASDAQ', name: 'Nasdaq Stock Market', country: 'US', timezone: 'America/New_York' }]));
      const provider = new TwelveDataInstrumentMetadataProvider('test-key');

      const metadata = await provider.getExchangeMetadata('NASDAQ');

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/exchanges?code=NASDAQ&apikey=test-key'), expect.anything());
      expect(metadata).toEqual({ exchangeCode: 'NASDAQ', name: 'Nasdaq Stock Market', country: 'US', timezone: 'America/New_York' });
    });

    it('throws ProviderUnavailableError when Twelve Data returns no matching exchange', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, []));
      const provider = new TwelveDataInstrumentMetadataProvider('test-key');

      await expect(provider.getExchangeMetadata('NOT-REAL')).rejects.toBeInstanceOf(ProviderUnavailableError);
    });
  });
});
