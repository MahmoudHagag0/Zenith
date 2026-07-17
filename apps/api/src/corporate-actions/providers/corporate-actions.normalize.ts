import type { ProviderDividendEvent, ProviderSplitEvent } from './corporate-actions-provider.interface';
import type { FinnhubDividendEvent, FinnhubSplitEvent } from './corporate-actions.schemas';

/**
 * Finnhub → internal DTO mapping (L1-006), following the exact
 * `normalize()` convention established in S1-012 and reused by every
 * prior L1 Sprint. Finnhub's shape never leaks past this file -- the
 * `raw` field preserves the original row for storage (Architecture Team
 * traceability requirement), not for re-parsing elsewhere.
 *
 * Finnhub does not supply a distinct per-event identifier for splits or
 * dividends, so `providerEventId` is left undefined here -- an honest
 * absence, not a fabricated one, per the Architecture Team's own "when
 * available" phrasing.
 */
export function normalizeFinnhubSplit(raw: FinnhubSplitEvent): ProviderSplitEvent | null {
  const effectiveDate = new Date(raw.date);
  if (Number.isNaN(effectiveDate.getTime())) return null;
  if (!raw.fromFactor) return null;
  return { effectiveDate, ratio: raw.toFactor / raw.fromFactor, raw };
}

export function normalizeFinnhubDividend(raw: FinnhubDividendEvent): ProviderDividendEvent | null {
  const effectiveDate = new Date(raw.date);
  if (Number.isNaN(effectiveDate.getTime())) return null;
  return { effectiveDate, amount: raw.amount, currency: raw.currency ?? 'USD', raw };
}
