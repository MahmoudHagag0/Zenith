import { SimulatedMarketDataProvider } from './simulated-market-data.provider';

describe('SimulatedMarketDataProvider', () => {
  let provider: SimulatedMarketDataProvider;

  beforeEach(() => {
    provider = new SimulatedMarketDataProvider();
  });

  it('returns a quote with a positive price and the requested symbol', async () => {
    const quote = await provider.getQuote('AAPL');

    expect(quote.symbol).toBe('AAPL');
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.currency).toBe('USD');
    expect(quote.asOf).toBeInstanceOf(Date);
  });

  it('returns the same price for two quotes in the same time bucket', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick'] }).setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    try {
      const first = await provider.getQuote('AAPL');
      const second = await provider.getQuote('AAPL');

      expect(second.price).toBe(first.price);
    } finally {
      jest.useRealTimers();
    }
  });

  it('returns different base prices for different symbols', async () => {
    const aapl = await provider.getQuote('AAPL');
    const msft = await provider.getQuote('MSFT');

    expect(aapl.price).not.toBe(msft.price);
  });

  it('returns one candle per day (inclusive) for the requested range, each with high >= low', async () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-05T00:00:00.000Z');

    const candles = await provider.getCandles('AAPL', from, to);

    expect(candles).toHaveLength(5);
    for (const candle of candles) {
      expect(candle.high).toBeGreaterThanOrEqual(candle.low);
      expect(candle.open).toBeGreaterThan(0);
      expect(candle.close).toBeGreaterThan(0);
      expect(candle.volume).toBeGreaterThan(0);
    }
  });

  it('returns deterministic candles for the same symbol and date', async () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const first = await provider.getCandles('AAPL', from, from);
    const second = await provider.getCandles('AAPL', from, from);

    expect(first).toEqual(second);
  });

  it('reports healthy', async () => {
    await expect(provider.checkHealth()).resolves.toBe('UP');
  });
});
