import { createCalendarNewsProvider } from './calendar-news-provider.factory';
import { SimulatedCalendarNewsProvider } from './simulated-calendar-news.provider';
import { LiveCalendarNewsProvider } from './live-calendar-news.provider';

describe('createCalendarNewsProvider', () => {
  const logger = { warn: jest.fn() };

  beforeEach(() => {
    logger.warn.mockClear();
  });

  it('returns SimulatedCalendarNewsProvider when mode is undefined', () => {
    const provider = createCalendarNewsProvider(undefined, undefined, undefined, undefined, logger);
    expect(provider).toBeInstanceOf(SimulatedCalendarNewsProvider);
  });

  it('returns SimulatedCalendarNewsProvider when mode is "simulated"', () => {
    const provider = createCalendarNewsProvider('fmp-key', 'finnhub-key', 'marketaux-key', 'simulated', logger);
    expect(provider).toBeInstanceOf(SimulatedCalendarNewsProvider);
  });

  it('returns LiveCalendarNewsProvider when mode is "live" and all three keys are configured', () => {
    const provider = createCalendarNewsProvider('fmp-key', 'finnhub-key', 'marketaux-key', 'live', logger);
    expect(provider).toBeInstanceOf(LiveCalendarNewsProvider);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each([
    ['FMP', undefined, 'finnhub-key', 'marketaux-key'],
    ['Finnhub', 'fmp-key', undefined, 'marketaux-key'],
    ['MarketAux', 'fmp-key', 'finnhub-key', undefined],
  ])('falls back to Simulated and logs a warning when mode is "live" but %s key is missing', (_label, fmpKey, finnhubKey, marketAuxKey) => {
    const provider = createCalendarNewsProvider(fmpKey, finnhubKey, marketAuxKey, 'live', logger);

    expect(provider).toBeInstanceOf(SimulatedCalendarNewsProvider);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
