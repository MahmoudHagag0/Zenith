import type { ProviderCotReport } from './cot-provider.interface';
import type { CftcLegacyReportRow } from './cot.schemas';

/**
 * CFTC Legacy report row → internal ProviderCotReport mapping (L1-004),
 * following the exact `normalize()` convention established in S1-012 and
 * reused by L1-001's `twelve-data.normalize.ts`. The CFTC's shape never
 * leaks past this file.
 *
 * One CFTC row carries all three trader categories' long/short positions
 * as separate fields for a single report date -- this explodes it into
 * three ProviderCotReport entries (one per CotTraderCategory), matching
 * the existing interface's per-category granularity exactly as
 * SimulatedCotProvider already produces.
 */
export function normalizeCftcRow(raw: CftcLegacyReportRow): ProviderCotReport[] {
  const reportDate = new Date(raw.report_date_as_yyyy_mm_dd);
  if (Number.isNaN(reportDate.getTime())) return [];

  return [
    {
      reportDate,
      category: 'COMMERCIAL',
      longPositions: Number.parseFloat(raw.comm_positions_long_all),
      shortPositions: Number.parseFloat(raw.comm_positions_short_all),
    },
    {
      reportDate,
      category: 'NON_COMMERCIAL',
      longPositions: Number.parseFloat(raw.noncomm_positions_long_all),
      shortPositions: Number.parseFloat(raw.noncomm_positions_short_all),
    },
    {
      reportDate,
      category: 'NON_REPORTABLE',
      longPositions: Number.parseFloat(raw.nonrept_positions_long_all),
      shortPositions: Number.parseFloat(raw.nonrept_positions_short_all),
    },
  ];
}
