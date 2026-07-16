import { z } from 'zod';

/**
 * Twelve Data raw response schemas (28_LIVE_DATA_BLUEPRINT.md §4.3/§4.4 —
 * "raw-schema Zod validation, catches vendor schema drift early"). Twelve
 * Data returns numeric fields as JSON strings (a documented API quirk),
 * hence `z.string()` rather than `z.number()` for price/volume fields —
 * parsed to numbers only in the normalize() step, never here.
 *
 * Twelve Data signals an error two different ways: some failures return a
 * non-2xx HTTP status (handled by MarketDataHttpClient); others return
 * HTTP 200 with an error-shaped JSON body (`status: "error"`) — e.g. an
 * invalid symbol or an exhausted daily credit quota. `twelveDataErrorSchema`
 * exists specifically to catch the second case, which a raw quote/candle
 * schema alone would not.
 */
export const twelveDataErrorSchema = z.object({
  code: z.number().optional(),
  message: z.string(),
  status: z.literal('error'),
});

export const twelveDataQuoteSchema = z.object({
  symbol: z.string(),
  currency: z.string(),
  datetime: z.string().optional(),
  timestamp: z.number().optional(),
  close: z.string(),
});

const twelveDataCandleValueSchema = z.object({
  datetime: z.string(),
  open: z.string(),
  high: z.string(),
  low: z.string(),
  close: z.string(),
  volume: z.string(),
});

export const twelveDataTimeSeriesSchema = z.object({
  meta: z.object({
    symbol: z.string(),
    currency: z.string().optional(),
  }),
  values: z.array(twelveDataCandleValueSchema),
});

export type TwelveDataQuote = z.infer<typeof twelveDataQuoteSchema>;
export type TwelveDataTimeSeries = z.infer<typeof twelveDataTimeSeriesSchema>;
