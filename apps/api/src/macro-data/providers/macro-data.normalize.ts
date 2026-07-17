import type { ProviderMacroSeriesValue } from './macro-data-provider.interface';
import type { FredObservation } from './macro-data.schemas';

/**
 * FRED → internal DTO mapping (L1-007), following the exact `normalize()`
 * convention established in S1-012 and reused by every prior L1 Sprint.
 * FRED's shape never leaks past this file -- the `raw` field preserves
 * the original observation for storage (traceability), not for re-parsing
 * elsewhere.
 *
 * FRED represents a not-yet-published or withheld observation as the
 * literal string "." -- this normalizes to null (filtered out), never a
 * fabricated 0 or NaN, matching every prior Sprint's timestamp/value
 * validation precedent (e.g. L1-003's calendar-news normalize).
 */
export function normalizeFredObservation(seriesId: string, raw: FredObservation): ProviderMacroSeriesValue | null {
  const observationDate = new Date(raw.date);
  if (Number.isNaN(observationDate.getTime())) return null;

  if (raw.value === '.') return null;
  const value = Number(raw.value);
  if (Number.isNaN(value)) return null;

  return { seriesId, observationDate, value, raw };
}
