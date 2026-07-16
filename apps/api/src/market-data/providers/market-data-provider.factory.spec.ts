import { createMarketDataProvider } from './market-data-provider.factory';
import { SimulatedMarketDataProvider } from './simulated-market-data.provider';
import { TwelveDataMarketDataProvider } from './twelve-data-market-data.provider';

describe('createMarketDataProvider', () => {
  const logger = { warn: jest.fn() };

  beforeEach(() => {
    logger.warn.mockClear();
  });

  it('returns SimulatedMarketDataProvider when mode is undefined', () => {
    const provider = createMarketDataProvider(undefined, undefined, logger);
    expect(provider).toBeInstanceOf(SimulatedMarketDataProvider);
  });

  it('returns SimulatedMarketDataProvider when mode is "simulated"', () => {
    const provider = createMarketDataProvider('some-key', 'simulated', logger);
    expect(provider).toBeInstanceOf(SimulatedMarketDataProvider);
  });

  it('returns TwelveDataMarketDataProvider when mode is "live" and an API key is configured', () => {
    const provider = createMarketDataProvider('real-key', 'live', logger);
    expect(provider).toBeInstanceOf(TwelveDataMarketDataProvider);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('falls back to SimulatedMarketDataProvider and logs a warning when mode is "live" but no API key is configured', () => {
    const provider = createMarketDataProvider(undefined, 'live', logger);

    expect(provider).toBeInstanceOf(SimulatedMarketDataProvider);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('falling back to SimulatedMarketDataProvider'));
  });

  it('falls back to SimulatedMarketDataProvider and logs a warning when mode is "live" and the API key is an empty string', () => {
    const provider = createMarketDataProvider('', 'live', logger);

    expect(provider).toBeInstanceOf(SimulatedMarketDataProvider);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
