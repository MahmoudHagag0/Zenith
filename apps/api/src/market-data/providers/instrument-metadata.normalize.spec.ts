import { normalizeExchangeMetadata, normalizeInstrumentMetadata, normalizeSymbolSearchResults } from './instrument-metadata.normalize';

describe('instrument-metadata.normalize', () => {
  describe('normalizeSymbolSearchResults', () => {
    it('maps Twelve Data symbol-search rows into ProviderSymbolSearchResult entries', () => {
      const results = normalizeSymbolSearchResults({
        data: [
          { symbol: 'TSLA', instrument_name: 'Tesla Inc.', exchange: 'NASDAQ' },
          { symbol: 'TSLA.SW', instrument_name: 'Tesla Inc. (Swiss)', exchange: 'SIX' },
        ],
      });

      expect(results).toEqual([
        { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
        { symbol: 'TSLA.SW', name: 'Tesla Inc. (Swiss)', exchange: 'SIX' },
      ]);
    });

    it('returns an empty array for an empty result set', () => {
      expect(normalizeSymbolSearchResults({ data: [] })).toEqual([]);
    });
  });

  describe('normalizeInstrumentMetadata', () => {
    it('maps a Twelve Data quote row into ProviderInstrumentMetadata with placeholder tick/lot size', () => {
      const metadata = normalizeInstrumentMetadata({ symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD' });

      expect(metadata).toEqual({ symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', tickSize: 0.01, lotSize: 1 });
    });

    it('falls back to the symbol itself when name is missing, and "UNKNOWN" when exchange is missing', () => {
      const metadata = normalizeInstrumentMetadata({ symbol: 'AAPL', currency: 'USD' });

      expect(metadata.name).toBe('AAPL');
      expect(metadata.exchange).toBe('UNKNOWN');
    });
  });

  describe('normalizeExchangeMetadata', () => {
    it('maps a Twelve Data exchange row into ProviderExchangeMetadata', () => {
      const metadata = normalizeExchangeMetadata({ code: 'NASDAQ', name: 'Nasdaq Stock Market', country: 'US', timezone: 'America/New_York' });

      expect(metadata).toEqual({ exchangeCode: 'NASDAQ', name: 'Nasdaq Stock Market', country: 'US', timezone: 'America/New_York' });
    });

    it('falls back to "UNKNOWN" country and "UTC" timezone when missing', () => {
      const metadata = normalizeExchangeMetadata({ code: 'NASDAQ', name: 'Nasdaq Stock Market' });

      expect(metadata.country).toBe('UNKNOWN');
      expect(metadata.timezone).toBe('UTC');
    });
  });
});
