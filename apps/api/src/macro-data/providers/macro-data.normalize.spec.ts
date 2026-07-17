import { normalizeFredObservation } from './macro-data.normalize';

describe('normalizeFredObservation', () => {
  it('maps a valid observation to the internal DTO', () => {
    const value = normalizeFredObservation('FEDFUNDS', { date: '2026-06-01', value: '5.33' });

    expect(value).toEqual({
      seriesId: 'FEDFUNDS',
      observationDate: new Date('2026-06-01'),
      value: 5.33,
      raw: { date: '2026-06-01', value: '5.33' },
    });
  });

  it('returns null for an unparseable observation date rather than persisting a nonsensical timestamp', () => {
    const value = normalizeFredObservation('FEDFUNDS', { date: 'not-a-date', value: '5.33' });

    expect(value).toBeNull();
  });

  it('returns null for a not-yet-published observation (FRED\'s "." sentinel) rather than fabricating a value', () => {
    const value = normalizeFredObservation('FEDFUNDS', { date: '2026-06-01', value: '.' });

    expect(value).toBeNull();
  });

  it('returns null for an unparseable numeric value', () => {
    const value = normalizeFredObservation('FEDFUNDS', { date: '2026-06-01', value: 'not-a-number' });

    expect(value).toBeNull();
  });
});
