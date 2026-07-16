import { z } from 'zod';

/**
 * Raw response schemas for the three vendors this Sprint integrates
 * (L1-003, 28_LIVE_DATA_BLUEPRINT.md §9 Phase 3) — permissive, only the
 * fields actually consumed, following the exact convention established by
 * `twelve-data.schemas.ts` (L1-001).
 */

// FMP's Economic Calendar endpoint returns a flat array, one row per
// scheduled release, with no per-symbol scoping (see calendar-news.normalize.ts).
export const fmpEconomicCalendarEventSchema = z.object({
  date: z.string(),
  event: z.string(),
  country: z.string().optional(),
  impact: z.string().nullable().optional(),
});
export const fmpEconomicCalendarResponseSchema = z.array(fmpEconomicCalendarEventSchema);

// Finnhub's /company-news returns a flat array scoped by the `symbol` query param.
export const finnhubNewsItemSchema = z.object({
  headline: z.string(),
  datetime: z.number(),
  source: z.string().optional(),
  summary: z.string().optional(),
});
export const finnhubNewsResponseSchema = z.array(finnhubNewsItemSchema);

// MarketAux's /news/all wraps its array in a `data` envelope.
export const marketAuxNewsItemSchema = z.object({
  title: z.string(),
  published_at: z.string(),
  source: z.string().optional(),
  description: z.string().optional(),
  snippet: z.string().optional(),
});
export const marketAuxNewsResponseSchema = z.object({
  data: z.array(marketAuxNewsItemSchema),
});

export type FmpEconomicCalendarEvent = z.infer<typeof fmpEconomicCalendarEventSchema>;
export type FinnhubNewsItem = z.infer<typeof finnhubNewsItemSchema>;
export type MarketAuxNewsItem = z.infer<typeof marketAuxNewsItemSchema>;
