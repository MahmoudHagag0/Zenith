import { z } from 'zod';

/**
 * Twelve Data raw response schemas for Symbol Search, Instrument Metadata,
 * and Exchange Metadata (L1-005, 28_LIVE_DATA_BLUEPRINT.md §9 Phase 5) --
 * permissive, only the fields actually consumed, following the exact
 * convention established by `twelve-data.schemas.ts` (L1-001).
 */

export const twelveDataSymbolSearchResultSchema = z.object({
  symbol: z.string(),
  instrument_name: z.string(),
  exchange: z.string(),
});

export const twelveDataSymbolSearchResponseSchema = z.object({
  data: z.array(twelveDataSymbolSearchResultSchema),
});

// Instrument Metadata reuses Twelve Data's /quote endpoint (the same
// endpoint L1-001's TwelveDataMarketDataProvider already calls for
// getQuote()) -- this Sprint's own raw schema, broader than
// twelve-data.schemas.ts's narrower quote schema, since it also needs
// `name`/`exchange` fields not required by the quote path.
export const twelveDataInstrumentQuoteSchema = z.object({
  symbol: z.string(),
  name: z.string().optional(),
  exchange: z.string().optional(),
  currency: z.string(),
});

// Twelve Data's /exchanges reference-data endpoint returns a flat array.
export const twelveDataExchangeSchema = z.object({
  code: z.string(),
  name: z.string(),
  country: z.string().optional(),
  timezone: z.string().optional(),
});

export const twelveDataExchangeResponseSchema = z.array(twelveDataExchangeSchema);

export type TwelveDataSymbolSearchResponse = z.infer<typeof twelveDataSymbolSearchResponseSchema>;
export type TwelveDataInstrumentQuote = z.infer<typeof twelveDataInstrumentQuoteSchema>;
export type TwelveDataExchange = z.infer<typeof twelveDataExchangeSchema>;
