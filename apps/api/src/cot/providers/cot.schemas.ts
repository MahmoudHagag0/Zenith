import { z } from 'zod';

/**
 * Raw response schema for the CFTC's Socrata Open Data API, Legacy
 * Futures-Only report (L1-004, 28_LIVE_DATA_BLUEPRINT.md §9 Phase 4) --
 * permissive, only the fields actually consumed, following the exact
 * convention established by `twelve-data.schemas.ts` (L1-001). Like
 * Twelve Data, Socrata's SODA API returns numeric columns as JSON strings
 * -- hence `z.string()` rather than `z.number()`, parsed only in the
 * normalize() step.
 */
export const cftcLegacyReportRowSchema = z.object({
  report_date_as_yyyy_mm_dd: z.string(),
  comm_positions_long_all: z.string(),
  comm_positions_short_all: z.string(),
  noncomm_positions_long_all: z.string(),
  noncomm_positions_short_all: z.string(),
  nonrept_positions_long_all: z.string(),
  nonrept_positions_short_all: z.string(),
});

export const cftcLegacyReportResponseSchema = z.array(cftcLegacyReportRowSchema);

export type CftcLegacyReportRow = z.infer<typeof cftcLegacyReportRowSchema>;
