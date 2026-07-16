import { LiveCalendarNewsProvider } from './live-calendar-news.provider';

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('LiveCalendarNewsProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('exposes "fmp-finnhub-marketaux" as its provider name', () => {
    expect(new LiveCalendarNewsProvider('fmp-key', 'finnhub-key', 'marketaux-key').name).toBe('fmp-finnhub-marketaux');
  });

  describe('getUpcomingEvents', () => {
    it('calls the FMP economic calendar endpoint and normalizes the response', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse(200, [{ date: '2026-08-01 12:30:00', event: 'Nonfarm Payrolls', country: 'US', impact: 'High' }]));
      const provider = new LiveCalendarNewsProvider('fmp-key', 'finnhub-key', 'marketaux-key');

      const events = await provider.getUpcomingEvents('AAPL');

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('financialmodelingprep.com'), expect.anything());
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('apikey=fmp-key'), expect.anything());
      expect(events).toEqual([
        {
          title: 'Nonfarm Payrolls',
          category: 'ECONOMIC',
          importance: 'HIGH',
          description: 'Scheduled economic release for US: Nonfarm Payrolls.',
          scheduledAt: new Date('2026-08-01 12:30:00'),
        },
      ]);
    });
  });

  describe('getNews', () => {
    it('merges deduplicated Finnhub (primary) and MarketAux (secondary) results when both succeed', async () => {
      global.fetch = jest
        .fn()
        .mockImplementation((url: string) => {
          if (url.includes('finnhub.io')) {
            return Promise.resolve(
              jsonResponse(200, [{ headline: 'Shared Story', datetime: 1_785_000_000, source: 'Reuters', summary: 'Finnhub version.' }]),
            );
          }
          if (url.includes('marketaux.com')) {
            return Promise.resolve(
              jsonResponse(200, {
                data: [
                  { title: 'Shared Story', published_at: '2026-08-01T00:00:00.000000Z', source: 'MarketAux Wire', description: 'MarketAux version.' },
                  { title: 'MarketAux-only Story', published_at: '2026-08-01T00:00:00.000000Z', source: 'MarketAux Wire', description: 'Extra.' },
                ],
              }),
            );
          }
          throw new Error(`Unexpected URL: ${url}`);
        });
      const provider = new LiveCalendarNewsProvider('fmp-key', 'finnhub-key', 'marketaux-key');

      const news = await provider.getNews('AAPL');

      // "Shared Story" appears from both sources -- the Finnhub (primary)
      // version must win on the duplicate, and MarketAux's unique story is
      // still merged in (enrichment).
      expect(news).toEqual([
        { headline: 'Shared Story', summary: 'Finnhub version.', category: 'MARKET', source: 'Reuters', publishedAt: new Date(1_785_000_000 * 1000) },
        {
          headline: 'MarketAux-only Story',
          summary: 'Extra.',
          category: 'MARKET',
          source: 'MarketAux Wire',
          publishedAt: new Date('2026-08-01T00:00:00.000000Z'),
        },
      ]);
    });

    it('falls back to MarketAux alone when Finnhub fails', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('finnhub.io')) {
          return Promise.resolve(jsonResponse(500, { error: 'down' }));
        }
        return Promise.resolve(
          jsonResponse(200, { data: [{ title: 'MarketAux Fallback Story', published_at: '2026-08-01T00:00:00.000000Z', source: 'MarketAux Wire' }] }),
        );
      });
      const provider = new LiveCalendarNewsProvider('fmp-key', 'finnhub-key', 'marketaux-key');

      const news = await provider.getNews('AAPL');

      expect(news).toEqual([
        { headline: 'MarketAux Fallback Story', summary: '', category: 'MARKET', source: 'MarketAux Wire', publishedAt: new Date('2026-08-01T00:00:00.000000Z') },
      ]);
    });

    it('still returns Finnhub results when MarketAux (best-effort enrichment) fails', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('finnhub.io')) {
          return Promise.resolve(jsonResponse(200, [{ headline: 'Finnhub-only Story', datetime: 1_785_000_000, source: 'Reuters' }]));
        }
        return Promise.resolve(jsonResponse(500, { error: 'down' }));
      });
      const provider = new LiveCalendarNewsProvider('fmp-key', 'finnhub-key', 'marketaux-key');

      const news = await provider.getNews('AAPL');

      expect(news).toEqual([
        { headline: 'Finnhub-only Story', summary: '', category: 'MARKET', source: 'Reuters', publishedAt: new Date(1_785_000_000 * 1000) },
      ]);
    });

    it(
      'throws when both Finnhub and MarketAux fail',
      async () => {
        global.fetch = jest.fn().mockResolvedValue(jsonResponse(500, { error: 'down' }));
        const provider = new LiveCalendarNewsProvider('fmp-key', 'finnhub-key', 'marketaux-key');

        // Both clients retry (default backoff) before exhausting, so this
        // one case genuinely takes longer than Jest's default timeout allows.
        await expect(provider.getNews('AAPL')).rejects.toThrow();
      },
      10_000,
    );
  });
});
