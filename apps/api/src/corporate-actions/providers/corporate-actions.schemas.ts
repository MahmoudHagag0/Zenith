import { z } from 'zod';

/**
 * Raw response schemas for Finnhub's /stock/split and /stock/dividend
 * endpoints (L1-006, 28_LIVE_DATA_BLUEPRINT.md §9 Phase 6) -- permissive,
 * only the fields actually consumed, following the exact convention
 * established by `twelve-data.schemas.ts` (L1-001).
 */

export const finnhubSplitEventSchema = z.object({
  date: z.string(),
  fromFactor: z.number(),
  toFactor: z.number(),
});
export const finnhubSplitResponseSchema = z.array(finnhubSplitEventSchema);

export const finnhubDividendEventSchema = z.object({
  date: z.string(),
  amount: z.number(),
  currency: z.string().optional(),
});
export const finnhubDividendResponseSchema = z.array(finnhubDividendEventSchema);

export type FinnhubSplitEvent = z.infer<typeof finnhubSplitEventSchema>;
export type FinnhubDividendEvent = z.infer<typeof finnhubDividendEventSchema>;
