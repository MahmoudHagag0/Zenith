import { Prisma } from '@zenith/database';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { LabeledConfidence } from '../analysis-provider.types';
import type { SupplyDemandZone } from './supply-demand.types';

/**
 * Disclosed, named calibration constants (S1-016 Sprint Brief, Missing
 * Decisions) for Supply & Demand's four Confidence-taxonomy values
 * (S1-008's generic `ConfidenceKind`s — this file supplies this
 * Provider's own numbers, it does not define the taxonomy itself).
 */

/**
 * Methodology Confidence Ceiling for `'SUPPLY_DEMAND'` — independently
 * calibrated, reflecting a sourcing profile similar to Price Action's own
 * (decentralized across independent retail-trading educators, no single
 * institutional-grade canonical text) but with more inherent subjectivity
 * in exactly where a zone's own proximal/distal boundaries sit across
 * sources. No result from this Provider may report a confidence above
 * this value.
 */
export const METHODOLOGY_CONFIDENCE_CEILING = 68;

/** Strengthens a zone's reading when the broader trend is moving in the same direction as this zone's own implied bias; weakens it when moving against. */
const WITH_TREND_MULTIPLIER = 1.15;
const AGAINST_TREND_MULTIPLIER = 0.85;

function capped(value: number): Prisma.Decimal {
  return Prisma.Decimal.min(new Prisma.Decimal(Math.max(value, 0)), METHODOLOGY_CONFIDENCE_CEILING);
}

/** How well this zone matches this Provider's own base-and-departure definition -- the weakest of its own tightness/departure-strength margins. */
export function buildDetectionConfidence(zone: SupplyDemandZone): LabeledConfidence {
  return {
    kind: 'DETECTION',
    value: capped(zone.qualityScore.value),
    explanation: `This zone's own quality score (${zone.qualityScore.value.toFixed(0)}, 0-100) is its Detection Confidence -- ${zone.qualityScore.explanation}`,
  };
}

/** This zone's own freshness/mitigation-decayed quality score, ranking entries within the bounded `interpretation[]`. */
export function buildInterpretationConfidence(zone: SupplyDemandZone): LabeledConfidence {
  return {
    kind: 'INTERPRETATION',
    value: capped(zone.interpretationScore),
    explanation: `This zone's own quality score, decayed by its freshness (${zone.freshness})/mitigation (${zone.mitigation}) combination, is ${zone.interpretationScore.toFixed(0)} (0-100).`,
  };
}

/**
 * Strengthens a `DEMAND` zone's reading when the Regime/Context Service's
 * own `trendDirection` reads `'UP'`, weakens it when `'DOWN'`;
 * strengthens a `SUPPLY` zone's reading when it reads `'DOWN'`, weakens
 * it when `'UP'` -- trading with, not against, the broader trend
 * direction is a stronger claim. A genuinely distinct axis (`trendDirection`)
 * from every prior Provider's own `trendState`/`volatilityState`-keyed
 * rule. `'UNKNOWN'` applies no adjustment at all.
 */
export function buildRegimeAdjustedConfidence(zone: SupplyDemandZone, regimeResult: RegimeContextResult): LabeledConfidence {
  const interpretationValue = buildInterpretationConfidence(zone).value.toNumber();

  if (regimeResult.trendDirection === 'UNKNOWN') {
    return {
      kind: 'REGIME_ADJUSTED',
      value: capped(interpretationValue),
      explanation: "No regime adjustment applies -- the broader trend direction currently reads UNKNOWN.",
    };
  }

  const strengthenOn = zone.type === 'DEMAND' ? 'UP' : 'DOWN';
  const strengthened = regimeResult.trendDirection === strengthenOn;
  const multiplier = strengthened ? WITH_TREND_MULTIPLIER : AGAINST_TREND_MULTIPLIER;

  return {
    kind: 'REGIME_ADJUSTED',
    value: capped(interpretationValue * multiplier),
    explanation: strengthened
      ? `Strengthened (${(WITH_TREND_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): this ${zone.type} zone's own implied bias currently agrees with the broader trend direction (${regimeResult.trendDirection}).`
      : `Weakened (${(AGAINST_TREND_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): this ${zone.type} zone's own implied bias currently opposes the broader trend direction (${regimeResult.trendDirection}).`,
  };
}

/** Constant per Provider, not per result -- this Provider's own disclosed ceiling, reported alongside every output. */
export function buildMethodologyConfidenceCeiling(): LabeledConfidence {
  return {
    kind: 'METHODOLOGY_CEILING',
    value: new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING),
    explanation:
      "This Provider's methodology is taught across many decentralized, independently-authored retail-trading sources with no single institutional-grade canonical text, and carries more inherent subjectivity in exact zone-boundary placement than some other registered methodologies' own more mechanically-measured criteria -- an independently calibrated ceiling, reflecting neither full source-verified confidence nor the absence of any corroborating source.",
  };
}
