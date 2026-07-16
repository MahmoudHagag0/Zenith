import { normalizeCftcRow } from './cot.normalize';

describe('normalizeCftcRow', () => {
  it('explodes one CFTC row into three ProviderCotReport entries, one per category', () => {
    const reports = normalizeCftcRow({
      report_date_as_yyyy_mm_dd: '2026-07-14T00:00:00.000',
      comm_positions_long_all: '60000',
      comm_positions_short_all: '55000',
      noncomm_positions_long_all: '40000',
      noncomm_positions_short_all: '35000',
      nonrept_positions_long_all: '10000',
      nonrept_positions_short_all: '9000',
    });

    expect(reports).toEqual([
      { reportDate: new Date('2026-07-14T00:00:00.000'), category: 'COMMERCIAL', longPositions: 60000, shortPositions: 55000 },
      { reportDate: new Date('2026-07-14T00:00:00.000'), category: 'NON_COMMERCIAL', longPositions: 40000, shortPositions: 35000 },
      { reportDate: new Date('2026-07-14T00:00:00.000'), category: 'NON_REPORTABLE', longPositions: 10000, shortPositions: 9000 },
    ]);
  });

  it('returns an empty array for an unparseable report date rather than persisting a nonsensical timestamp', () => {
    const reports = normalizeCftcRow({
      report_date_as_yyyy_mm_dd: 'not-a-date',
      comm_positions_long_all: '1',
      comm_positions_short_all: '1',
      noncomm_positions_long_all: '1',
      noncomm_positions_short_all: '1',
      nonrept_positions_long_all: '1',
      nonrept_positions_short_all: '1',
    });

    expect(reports).toEqual([]);
  });
});
