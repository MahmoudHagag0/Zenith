import type { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';

/**
 * Supply-and-Demand-internal types (S1-016). These exist only inside this
 * directory and are never surfaced as a new field on the shared,
 * methodology-neutral `AnalysisProvider` contract (`Evidence`,
 * `Interpretation`, `Limitations`, `Traceability`, `LabeledConfidence` —
 * S1-008). A future Provider never needs to know these types exist.
 *
 * Per the Architecture Team's direction (S1-016 Sprint Brief, Non-Scope /
 * Architecture Requirements): if any concept here later looks reusable
 * across methodologies, it stays inside `providers/supply-demand/` until
 * a dedicated future ADR authorizes promotion — never proactively.
 */

/** A zone's own directional bias — `DEMAND` from an upward departure, `SUPPLY` from a downward one (S1-016 Sprint Brief, Scope item 3). */
export type ZoneType = 'DEMAND' | 'SUPPLY';

/**
 * This methodology's own named origin vocabulary (S1-016 Sprint Brief,
 * Scope item 3) — the base's own immediately preceding candle's direction
 * combined with the departure's own direction. `RALLY_BASE_RALLY`/
 * `DROP_BASE_DROP` are continuation zones; `DROP_BASE_RALLY`/
 * `RALLY_BASE_DROP` are reversal zones.
 */
export type ZoneOrigin = 'RALLY_BASE_RALLY' | 'DROP_BASE_RALLY' | 'RALLY_BASE_DROP' | 'DROP_BASE_DROP';

/** How many distinct touch episodes have occurred since the zone formed (S1-016 Sprint Brief, Scope item 5) — never conflated with `MitigationStatus`. */
export type Freshness = 'FRESH' | 'TESTED_ONCE' | 'TESTED_MULTIPLE';

/** How deeply price has since violated the zone (S1-016 Sprint Brief, Scope item 5) — tracked independently of `Freshness`. */
export type MitigationStatus = 'UNMITIGATED' | 'PARTIALLY_MITIGATED' | 'FULLY_MITIGATED';

/** This zone's own near (proximal) and far (distal) edges — never a single price point, unlike a single key level. */
export interface ZoneBoundaries {
  readonly proximal: Prisma.Decimal;
  readonly distal: Prisma.Decimal;
}

/** A raw, structurally-qualified zone candidate (WP2) — before health/quality scoring. */
export interface RawZoneCandidate {
  readonly type: ZoneType;
  readonly origin: ZoneOrigin;
  readonly boundaries: ZoneBoundaries;
  readonly baseCandles: readonly MarketSeriesPoint[];
  readonly departureCandle: MarketSeriesPoint;
}

/** The disclosed measurements a zone's own Detection Confidence is built from (S1-016 Sprint Brief, Scope item 6) — never a named pattern lookup. */
export interface ZoneQualityScore {
  /** 0-100; the weaker of `baseTightnessScore`/`departureStrengthScore` — the "weakest link" idiom. */
  readonly value: number;
  readonly baseTightnessScore: number;
  readonly departureStrengthScore: number;
  readonly explanation: string;
}

/** The disclosed, forward-looking condition that would fully mitigate this zone -- directly answering "what invalidates this reading?". */
export interface ZoneInvalidation {
  readonly level: Prisma.Decimal;
  readonly description: string;
}

/**
 * A complete, classified, scored Supply & Demand zone reading -- one of
 * at most two currently-surviving hypotheses (one per side), never
 * claimed as the only zone that exists.
 */
export interface SupplyDemandZone {
  readonly type: ZoneType;
  readonly origin: ZoneOrigin;
  readonly boundaries: ZoneBoundaries;
  readonly departureCandle: MarketSeriesPoint;
  readonly freshness: Freshness;
  readonly mitigation: MitigationStatus;
  readonly qualityScore: ZoneQualityScore;
  /** 0-100; `qualityScore.value` decayed by this zone's own freshness/mitigation combination. */
  readonly interpretationScore: number;
  readonly invalidation: ZoneInvalidation;
  readonly survivalReasons: readonly string[];
  readonly weaknesses: readonly string[];
}
