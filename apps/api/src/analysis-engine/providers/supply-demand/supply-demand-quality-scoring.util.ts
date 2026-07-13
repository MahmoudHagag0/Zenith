import { Prisma } from '@zenith/database';
import type { IndicatorSeriesEntry } from '../../indicator-engine/indicator-engine.types';
import type { Freshness, MitigationStatus, RawZoneCandidate, ZoneQualityScore } from './supply-demand.types';
import { BASE_LOOSE_ATR_MULTIPLE, BASE_TIGHT_ATR_MULTIPLE, DEPARTURE_MIN_ATR_MULTIPLE } from './supply-demand-candidate-generator.util';

/** Disclosed calibration (S1-016 Sprint Brief, Missing Decisions): the departure candle's own ATR-relative body size that earns a full departure-strength score of 100. */
const DEPARTURE_FULL_SCORE_ATR_MULTIPLE = 3;

/**
 * Disclosed decay multipliers (S1-016 Sprint Brief, Missing Decisions)
 * applied to a zone's own quality score for Interpretation Confidence,
 * keyed by its freshness/mitigation combination. `UNMITIGATED` only ever
 * co-occurs with `FRESH` (any touch upgrades mitigation to at least
 * `PARTIALLY_MITIGATED` -- `supply-demand-zone-health.util.ts`), so only
 * five combinations are reachable.
 */
const DECAY_MULTIPLIERS: Record<string, number> = {
  'FRESH:UNMITIGATED': 1.0,
  'TESTED_ONCE:PARTIALLY_MITIGATED': 0.7,
  'TESTED_ONCE:FULLY_MITIGATED': 0.3,
  'TESTED_MULTIPLE:PARTIALLY_MITIGATED': 0.5,
  'TESTED_MULTIPLE:FULLY_MITIGATED': 0.15,
};

function findAtrAtOrBefore(atrSeries: readonly IndicatorSeriesEntry<Prisma.Decimal>[], timestamp: Date): Prisma.Decimal | null {
  let found: Prisma.Decimal | null = null;
  for (const entry of atrSeries) {
    if (entry.timestamp.getTime() <= timestamp.getTime()) {
      found = entry.value;
    } else {
      break;
    }
  }
  return found;
}

function scaledScore(ratio: Prisma.Decimal, zeroAt: number, fullAt: number): number {
  const raw = ratio.minus(zeroAt).dividedBy(fullAt - zeroAt).times(100);
  return Prisma.Decimal.max(Prisma.Decimal.min(raw, 100), 0).toNumber();
}

/**
 * The disclosed measurements a zone's own Detection Confidence is built
 * from (S1-016 Sprint Brief, Scope item 6): a base-tightness score (a
 * looser base scores lower) and a departure-strength score (a weaker
 * departure scores lower), the weaker of the two determining overall
 * quality -- the same "weakest link" idiom as every prior bounded-
 * hypothesis Provider.
 */
export function scoreZoneQuality(candidate: RawZoneCandidate, atrSeries: readonly IndicatorSeriesEntry<Prisma.Decimal>[]): ZoneQualityScore {
  const atr = findAtrAtOrBefore(atrSeries, candidate.departureCandle.timestamp);
  const baseHigh = Prisma.Decimal.max(...candidate.baseCandles.map((c) => c.high));
  const baseLow = Prisma.Decimal.min(...candidate.baseCandles.map((c) => c.low));

  if (!atr || atr.isZero()) {
    return { value: 0, baseTightnessScore: 0, departureStrengthScore: 0, explanation: 'No ATR value available at this zone -- quality cannot be scored.' };
  }

  const baseRangeAtrRatio = baseHigh.minus(baseLow).dividedBy(atr);
  // Tightness score is the inverse of looseness: a base at BASE_TIGHT_ATR_MULTIPLE scores 100, one at BASE_LOOSE_ATR_MULTIPLE scores 0.
  const baseTightnessScore = 100 - scaledScore(baseRangeAtrRatio, BASE_TIGHT_ATR_MULTIPLE, BASE_LOOSE_ATR_MULTIPLE);

  const departureBody = candidate.departureCandle.close.minus(candidate.departureCandle.open).abs();
  const departureAtrRatio = departureBody.dividedBy(atr);
  const departureStrengthScore = scaledScore(departureAtrRatio, DEPARTURE_MIN_ATR_MULTIPLE, DEPARTURE_FULL_SCORE_ATR_MULTIPLE);

  const value = Math.min(baseTightnessScore, departureStrengthScore);

  return {
    value,
    baseTightnessScore,
    departureStrengthScore,
    explanation: `Base tightness ${baseTightnessScore.toFixed(0)} (combined base range ${baseRangeAtrRatio.toFixed(2)}x ATR) and departure strength ${departureStrengthScore.toFixed(0)} (departure body ${departureAtrRatio.toFixed(2)}x ATR) -- the weaker of the two determines this zone's own Detection Confidence.`,
  };
}

/** Decays a zone's own quality score by its freshness/mitigation combination (S1-016 Sprint Brief, Scope item 6) -- an untested, unmitigated zone retains full strength; a repeatedly-tested, fully-mitigated zone scores weakest. */
export function scoreInterpretation(qualityScore: ZoneQualityScore, freshness: Freshness, mitigation: MitigationStatus): number {
  const multiplier = DECAY_MULTIPLIERS[`${freshness}:${mitigation}`] ?? 1.0;
  return qualityScore.value * multiplier;
}
