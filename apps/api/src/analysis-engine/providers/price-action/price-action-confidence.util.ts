import { Prisma } from '@zenith/database';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { LabeledConfidence } from '../analysis-provider.types';
import type { PriceActionReading } from './price-action.types';

/**
 * Disclosed, named calibration constants (S1-015 Sprint Brief, Missing
 * Decisions) for Price Action's four Confidence-taxonomy values (S1-008's
 * generic `ConfidenceKind`s — this file supplies this Provider's own
 * numbers, it does not define the taxonomy itself).
 */

/**
 * Methodology Confidence Ceiling for `'PRICE_ACTION'` — independently
 * calibrated: this methodology's five reaction states are classified by a
 * single deterministic sequential scan (more mechanical than an
 * interpretive bias classification), but its defining concepts are
 * broadly corroborated across many decentralized sources rather than one
 * single canonical, individually-authored text -- a sourcing profile
 * distinct from every other registered methodology's own. No result from
 * this Provider may report a confidence above this value.
 */
export const METHODOLOGY_CONFIDENCE_CEILING = 70;

/** Strengthens breakout/continuation readings when the Regime/Context Service reads `volatilityState: 'HIGH'`; weakens them when `'LOW'` -- a genuine directional move is a stronger claim alongside genuinely expanding volatility. */
const HIGH_VOLATILITY_MULTIPLIER = 1.15;
const LOW_VOLATILITY_MULTIPLIER = 0.85;

const DIRECTIONAL_STATES: readonly PriceActionReading['state'][] = ['BREAKOUT_UNCONFIRMED', 'BREAKOUT_CONFIRMED', 'BREAKOUT_FAILED'];

function capped(value: number): Prisma.Decimal {
  return Prisma.Decimal.min(new Prisma.Decimal(Math.max(value, 0)), METHODOLOGY_CONFIDENCE_CEILING);
}

/** How well the classified reaction matches this Provider's own state definition -- the quality-score measurement is this reading's own evidence match, the same "weakest link" idiom used across every registered methodology. */
export function buildDetectionConfidence(reading: PriceActionReading): LabeledConfidence {
  const value = reading.state === 'APPROACHING_LEVEL' ? 40 : reading.qualityScore.value;
  return {
    kind: 'DETECTION',
    value: capped(value),
    explanation:
      reading.state === 'APPROACHING_LEVEL'
        ? 'A static baseline: no reaction evidence exists yet at the key level, so no wick/body measurement can be scored.'
        : `This reading's own quality score (${value.toFixed(0)}, 0-100) is its Detection Confidence -- ${reading.qualityScore.explanation}`,
  };
}

/** Blends this reading's own quality score with its momentum score for directional (breakout) states -- interpreting a breakout's own continuation claim is strengthened by genuine momentum, distinct from Detection Confidence's own evidence-match measurement. */
export function buildInterpretationConfidence(reading: PriceActionReading): LabeledConfidence {
  const isDirectional = DIRECTIONAL_STATES.includes(reading.state);
  const value = reading.state === 'APPROACHING_LEVEL' ? 40 : isDirectional ? (reading.qualityScore.value + reading.momentumScore) / 2 : reading.qualityScore.value;
  return {
    kind: 'INTERPRETATION',
    value: capped(value),
    explanation: isDirectional
      ? `Averages this reading's own quality score (${reading.qualityScore.value.toFixed(0)}) with its momentum score (${reading.momentumScore.toFixed(0)}) -- a directional claim is strengthened by genuine momentum behind it.`
      : `This reading's own quality score (${value.toFixed(0)}) alone -- momentum is not computed for a non-directional state.`,
  };
}

/**
 * Strengthens breakout/continuation readings when the Regime/Context
 * Service reads `volatilityState: 'HIGH'`, weakens them when `'LOW'`;
 * strengthens `REJECTED_LEVEL` readings when it reads `'LOW'`, weakens
 * them when `'HIGH'` -- a genuinely state-dependent bifurcation of the
 * same `volatilityState` axis (a clean rejection is a stronger claim in a
 * genuinely quiet market, while a breakout is a stronger claim in a
 * genuinely expanding one). `APPROACHING_LEVEL` makes no directional claim
 * yet, so no regime adjustment applies to it at all.
 */
export function buildRegimeAdjustedConfidence(reading: PriceActionReading, regimeResult: RegimeContextResult): LabeledConfidence {
  const interpretationValue = buildInterpretationConfidence(reading).value.toNumber();

  if (reading.state === 'APPROACHING_LEVEL') {
    return {
      kind: 'REGIME_ADJUSTED',
      value: capped(interpretationValue),
      explanation: 'No regime adjustment applies -- this reading has made no directional claim yet to strengthen or weaken.',
    };
  }

  const isRejection = reading.state === 'REJECTED_LEVEL';
  const strengthenOn = isRejection ? 'LOW' : 'HIGH';
  const multiplier = regimeResult.volatilityState === strengthenOn ? HIGH_VOLATILITY_MULTIPLIER : LOW_VOLATILITY_MULTIPLIER;
  const strengthened = regimeResult.volatilityState === strengthenOn;

  return {
    kind: 'REGIME_ADJUSTED',
    value: capped(interpretationValue * multiplier),
    explanation: strengthened
      ? `Strengthened (${(HIGH_VOLATILITY_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): ${
          isRejection ? 'a clean rejection' : 'a genuine directional breakout'
        } is a stronger claim alongside the broader regime's current volatilityState=${regimeResult.volatilityState} read.`
      : `Weakened (${(LOW_VOLATILITY_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): the broader regime's current volatilityState=${regimeResult.volatilityState} read works against ${
          isRejection ? 'a clean rejection' : 'a genuine directional breakout'
        } claim.`,
  };
}

/** Constant per Provider, not per result -- this Provider's own disclosed ceiling, reported alongside every output. */
export function buildMethodologyConfidenceCeiling(): LabeledConfidence {
  return {
    kind: 'METHODOLOGY_CEILING',
    value: new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING),
    explanation:
      "This Provider's five reaction states are classified by a single deterministic sequential scan, more mechanical than an interpretive bias classification, but its defining concepts are broadly corroborated across many decentralized sources rather than one single canonical, individually-authored text -- an independently calibrated ceiling reflecting neither full source-verified confidence nor the absence of any corroborating source.",
  };
}
