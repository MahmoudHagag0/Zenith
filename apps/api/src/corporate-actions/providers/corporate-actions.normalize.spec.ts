import { normalizeFinnhubDividend, normalizeFinnhubSplit } from './corporate-actions.normalize';

describe('normalizeFinnhubSplit', () => {
  it('computes ratio as toFactor / fromFactor for a forward split', () => {
    const event = normalizeFinnhubSplit({ date: '2026-06-01', fromFactor: 1, toFactor: 2 });

    expect(event).toEqual({ effectiveDate: new Date('2026-06-01'), ratio: 2, raw: { date: '2026-06-01', fromFactor: 1, toFactor: 2 } });
  });

  it('computes ratio below 1 for a reverse split', () => {
    const event = normalizeFinnhubSplit({ date: '2026-06-01', fromFactor: 10, toFactor: 1 });

    expect(event?.ratio).toBe(0.1);
  });

  it('returns null for an unparseable effective date rather than persisting a nonsensical timestamp', () => {
    const event = normalizeFinnhubSplit({ date: 'not-a-date', fromFactor: 1, toFactor: 2 });

    expect(event).toBeNull();
  });

  it('returns null when fromFactor is zero rather than dividing by zero', () => {
    const event = normalizeFinnhubSplit({ date: '2026-06-01', fromFactor: 0, toFactor: 2 });

    expect(event).toBeNull();
  });

  it('leaves providerEventId undefined since Finnhub supplies no per-event identifier', () => {
    const event = normalizeFinnhubSplit({ date: '2026-06-01', fromFactor: 1, toFactor: 2 });

    expect(event?.providerEventId).toBeUndefined();
  });
});

describe('normalizeFinnhubDividend', () => {
  it('maps amount and currency directly', () => {
    const event = normalizeFinnhubDividend({ date: '2026-06-01', amount: 0.24, currency: 'USD' });

    expect(event).toEqual({
      effectiveDate: new Date('2026-06-01'),
      amount: 0.24,
      currency: 'USD',
      raw: { date: '2026-06-01', amount: 0.24, currency: 'USD' },
    });
  });

  it('defaults currency to USD when the provider omits it', () => {
    const event = normalizeFinnhubDividend({ date: '2026-06-01', amount: 0.24 });

    expect(event?.currency).toBe('USD');
  });

  it('returns null for an unparseable effective date', () => {
    const event = normalizeFinnhubDividend({ date: 'not-a-date', amount: 0.24 });

    expect(event).toBeNull();
  });
});
