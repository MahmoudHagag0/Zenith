import type { ProviderCalendarEvent, ProviderCalendarImportance, ProviderNewsItem } from './calendar-news-provider.interface';
import type { FinnhubNewsItem, FmpEconomicCalendarEvent, MarketAuxNewsItem } from './calendar-news.schemas';

/**
 * Vendor → internal DTO mapping (L1-003), following the exact `normalize()`
 * convention established in S1-012 and reused by L1-001's
 * `twelve-data.normalize.ts`. Vendor-specific shapes never leak past this
 * file. Returns `null` for any record whose timestamp cannot be parsed
 * (basic timestamp validation, per the L1-003 Sprint Brief's approved
 * Scope) rather than persisting a nonsensical date.
 */

function toImportance(impact: string | null | undefined): ProviderCalendarImportance {
  const normalized = (impact ?? '').trim().toLowerCase();
  if (normalized === 'high') return 'HIGH';
  if (normalized === 'medium') return 'MEDIUM';
  return 'LOW';
}

/**
 * FMP's Economic Calendar is a single global feed (no per-symbol
 * filtering) — Economic Calendar events (CPI, NFP, rate decisions) are
 * inherently macro, not company-specific, matching
 * 28_LIVE_DATA_BLUEPRINT.md §1's own framing ("global calendar, filtered
 * to relevant currencies/assets"). This Sprint surfaces the same
 * upcoming-events feed for every symbol; symbol/currency-specific
 * relevance filtering is a disclosed simplification, not part of this
 * Sprint's approved Scope.
 */
export function normalizeFmpEvent(raw: FmpEconomicCalendarEvent): ProviderCalendarEvent | null {
  const scheduledAt = new Date(raw.date);
  if (Number.isNaN(scheduledAt.getTime())) return null;
  return {
    title: raw.event,
    category: 'ECONOMIC',
    importance: toImportance(raw.impact),
    description: raw.country ? `Scheduled economic release for ${raw.country}: ${raw.event}.` : `Scheduled economic release: ${raw.event}.`,
    scheduledAt,
  };
}

export function normalizeFinnhubNewsItem(raw: FinnhubNewsItem): ProviderNewsItem | null {
  const publishedAt = new Date(raw.datetime * 1000);
  if (Number.isNaN(publishedAt.getTime())) return null;
  return {
    headline: raw.headline,
    summary: raw.summary ?? '',
    category: 'MARKET',
    source: raw.source ?? 'Finnhub',
    publishedAt,
  };
}

export function normalizeMarketAuxNewsItem(raw: MarketAuxNewsItem): ProviderNewsItem | null {
  const publishedAt = new Date(raw.published_at);
  if (Number.isNaN(publishedAt.getTime())) return null;
  return {
    headline: raw.title,
    summary: raw.description ?? raw.snippet ?? '',
    category: 'MARKET',
    source: raw.source ?? 'MarketAux',
    publishedAt,
  };
}

function normalizeHeadlineKey(headline: string): string {
  return headline.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Basic (not scored/confidence-weighted) deduplication across the
 * Finnhub-primary + MarketAux-secondary merge — explicitly part of this
 * Sprint's approved Scope, and explicitly NOT the Data Quality Layer's
 * semantic dedup (28_LIVE_DATA_BLUEPRINT.md Addendum §A1), which the
 * Architecture Team deferred to its own dedicated future Sprint. Items are
 * deduplicated by a normalized headline key; first occurrence wins, so
 * passing Finnhub's items before MarketAux's naturally keeps the primary
 * source's version of a duplicated story.
 */
export function dedupeNewsItems(items: ProviderNewsItem[]): ProviderNewsItem[] {
  const seen = new Set<string>();
  const result: ProviderNewsItem[] = [];
  for (const item of items) {
    const key = normalizeHeadlineKey(item.headline);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}
