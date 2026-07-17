import { z } from 'zod';

/**
 * Raw response schema for FRED's /fred/series/observations endpoint
 * (L1-007, 28_LIVE_DATA_BLUEPRINT.md §9 Phase 7) -- permissive, only the
 * fields actually consumed, following the exact convention established by
 * `twelve-data.schemas.ts` (L1-001). FRED represents a not-yet-published
 * or withheld observation as the literal string "." rather than omitting
 * the row -- `value` is left as a string here and validated/rejected at
 * the normalize() step, not coerced to a number in the raw schema.
 */

export const fredObservationSchema = z.object({
  date: z.string(),
  value: z.string(),
});

export const fredObservationsResponseSchema = z.object({
  observations: z.array(fredObservationSchema),
});

export type FredObservation = z.infer<typeof fredObservationSchema>;
export type FredObservationsResponse = z.infer<typeof fredObservationsResponseSchema>;
