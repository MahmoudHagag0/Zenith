import { InternalMarketSessionProvider } from './internal-market-session.provider';

describe('InternalMarketSessionProvider', () => {
  const provider = new InternalMarketSessionProvider();

  it('exposes "internal-market-session-table" as its provider name', () => {
    expect(provider.name).toBe('internal-market-session-table');
  });

  it('checkHealth() always reports UP -- it is a pure in-process lookup with no external dependency', async () => {
    await expect(provider.checkHealth()).resolves.toBe('UP');
  });

  it('returns UNKNOWN for an exchange code with no configured entry (e.g. the local demo exchange "ZDX")', async () => {
    await expect(provider.getMarketStatus('ZDX', new Date('2026-03-04T15:00:00Z'))).resolves.toBe('UNKNOWN');
  });

  describe('XNAS (America/New_York, 09:30-16:00 local, Mon-Fri)', () => {
    it('reports OPEN during regular trading hours on a normal weekday', async () => {
      // 2026-03-04 is a Wednesday, standard time (EST, UTC-5) -- 15:00Z = 10:00 local.
      await expect(provider.getMarketStatus('XNAS', new Date('2026-03-04T15:00:00Z'))).resolves.toBe('OPEN');
    });

    it('reports CLOSED before the local open time', async () => {
      // 13:00Z = 08:00 EST, before the 09:30 open.
      await expect(provider.getMarketStatus('XNAS', new Date('2026-03-04T13:00:00Z'))).resolves.toBe('CLOSED');
    });

    it('reports CLOSED at/after the local close time', async () => {
      // 22:00Z = 17:00 EST, after the 16:00 close.
      await expect(provider.getMarketStatus('XNAS', new Date('2026-03-04T22:00:00Z'))).resolves.toBe('CLOSED');
    });

    it('reports CLOSED on a weekend regardless of the time of day', async () => {
      // 2026-03-07 is a Saturday.
      await expect(provider.getMarketStatus('XNAS', new Date('2026-03-07T15:00:00Z'))).resolves.toBe('CLOSED');
    });

    it('reports CLOSED on a configured holiday even during what would otherwise be trading hours', async () => {
      // 2026-01-01 (New Year's Day) is a Thursday; 15:00Z = 10:00 EST, otherwise within hours.
      await expect(provider.getMarketStatus('XNAS', new Date('2026-01-01T15:00:00Z'))).resolves.toBe('CLOSED');
    });
  });

  describe('XLON (Europe/London, 08:00-16:30 local, Mon-Fri)', () => {
    it('reports OPEN during regular trading hours on a normal weekday', async () => {
      // 2026-03-04 is a Wednesday, GMT (UTC+0) -- 10:00Z = 10:00 local.
      await expect(provider.getMarketStatus('XLON', new Date('2026-03-04T10:00:00Z'))).resolves.toBe('OPEN');
    });

    it('reports CLOSED outside of local trading hours', async () => {
      // 17:00Z = 17:00 GMT, after the 16:30 close.
      await expect(provider.getMarketStatus('XLON', new Date('2026-03-04T17:00:00Z'))).resolves.toBe('CLOSED');
    });
  });

  it('defaults `at` to the current time when not provided', async () => {
    await expect(provider.getMarketStatus('ZDX')).resolves.toBe('UNKNOWN');
  });
});
