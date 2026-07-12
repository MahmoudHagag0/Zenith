import { Prisma } from '@zenith/database';

/**
 * `MarketSeries` — the Anti-Corruption Layer value object owned exclusively
 * by the Analysis Engine (22_ANALYSIS_ENGINE_ARCHITECTURE.md,
 * "Anti-Corruption Layer — Market Data Boundary"; ADR-005). No type in this
 * file references `Candle` or `MarketQuote` — those Prisma types are
 * referenced only inside `market-series.service.ts`'s translation adapter.
 */

/**
 * A historical, `Candle`-derived point. Data Quality here reflects
 * *completeness*, never recency: a historical bar is never `STALE`, since
 * staleness is a recency concept that does not apply to a fixed past bar.
 * Every entry in `MarketSeries.points` is, by construction, present data —
 * genuine gaps in the requested range are reported via
 * `MarketSeries.missingDates`, not as an inline per-point marker.
 */
export interface MarketSeriesPoint {
  readonly timestamp: Date;
  readonly open: Prisma.Decimal;
  readonly high: Prisma.Decimal;
  readonly low: Prisma.Decimal;
  readonly close: Prisma.Decimal;
  readonly volume: Prisma.Decimal;
  readonly dataQuality: { readonly kind: 'historical'; readonly completeness: 'PRESENT' };
}

export type CurrentQuoteFreshness = 'FRESH' | 'STALE' | 'MISSING';

/**
 * The live, `MarketQuote`-derived point. Data Quality here reflects genuine
 * *recency* — exactly as `MarketQuote` already behaves today — computed
 * from `fetchedAt` against the DEC-2026-009 staleness threshold. Always
 * present as a distinct object (never the whole `MarketSeries.currentQuote`
 * is itself `null`), with its own fields nullable when no quote exists at
 * all (`freshness: 'MISSING'`), so the current quote is never silently
 * merged into the historical `points` with a borrowed staleness meaning.
 */
export interface CurrentQuotePoint {
  readonly price: Prisma.Decimal | null;
  readonly currency: string | null;
  readonly asOf: Date | null;
  readonly fetchedAt: Date | null;
  readonly ageSeconds: number | null;
  readonly dataQuality: { readonly kind: 'current'; readonly freshness: CurrentQuoteFreshness };
}

export interface MarketSeries {
  readonly assetId: string;
  readonly requestedRange: { readonly from: Date; readonly to: Date };
  /** Ascending by timestamp; only dates with an actual `Candle` row. */
  readonly points: readonly MarketSeriesPoint[];
  /** ISO date strings (UTC, YYYY-MM-DD) for requested days with no `Candle` row. */
  readonly missingDates: readonly string[];
  readonly currentQuote: CurrentQuotePoint;
}
