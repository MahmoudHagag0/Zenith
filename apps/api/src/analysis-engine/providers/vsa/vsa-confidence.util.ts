import { Prisma } from '@zenith/database';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { LabeledConfidence } from '../analysis-provider.types';
import { isClimaxSignal } from './vsa-signal-detector.util';
import type { ClassifiedBar, VsaHypothesis } from './vsa.types';

/**
 * Disclosed, named calibration constants (S1-018 Sprint Brief, Missing
 * Decisions) for VSA's four Confidence-taxonomy values (S1-008's generic
 * `ConfidenceKind`s — this file supplies this Provider's own numbers, it
 * does not define the taxonomy itself).
 */

/**
 * Methodology Confidence Ceiling for `'VSA'` — independently calibrated,
 * reflecting this methodology's own distinct sourcing profile: a single
 * identifiable founder's own primary text (Tom Williams' "Master the
 * Markets") corroborated by a second identifiable author's own widely-
 * cited text (Anna Coulling's "A Complete Guide to Volume Price
 * Analysis") — a stronger sourcing shape than Price Action's or Supply
 * & Demand's fully decentralized multi-educator sourcing, but a newer,
 * less classically-settled body of work than the oldest registered
 * methodology's own. No result from this Provider may report a
 * confidence above this value.
 */
export const METHODOLOGY_CONFIDENCE_CEILING = 74;

/** Strengthens Interpretation Confidence when this signal's own bar occurred at or near a Swing-Detector-identified swing high/low -- classical VSA teaching reads these signals as most meaningful at genuine turning points. */
const SWING_PROXIMITY_MULTIPLIER = 1.2;

/** Strengthens/weakens Regime-Adjusted Confidence by signal category (climax-type vs. quiet-type) against the Regime/Context Service's own `volatilityState`. */
const WITH_VOLATILITY_MULTIPLIER = 1.15;
const AGAINST_VOLATILITY_MULTIPLIER = 0.85;

function capped(value: number): Prisma.Decimal {
  return Prisma.Decimal.min(new Prisma.Decimal(Math.max(value, 0)), METHODOLOGY_CONFIDENCE_CEILING);
}

/**
 * This bar's own raw anomaly magnitude (0-100): how far its own
 * volume-relative-to-baseline and spread-relative-to-ATR ratios deviate
 * from `1` (a perfectly average bar) -- the sharper the combined
 * deviation, the stronger the raw detection, regardless of signal
 * category (a climax-type bar deviates high in both ratios; a quiet-
 * type bar deviates low in both, an equally extreme anomaly in the
 * opposite direction).
 */
function anomalyMagnitude(bar: ClassifiedBar): number {
  const volumeDeviation = Math.abs(bar.volumeRatio - 1);
  const spreadDeviation = Math.abs(bar.spreadAtrRatio - 1);
  return Math.min(100, (volumeDeviation + spreadDeviation) * 40);
}

/** How well this signal's own bar matches this Provider's own signal definitions -- the raw anomaly magnitude of its own volume/spread deviation. */
export function buildDetectionConfidence(hypothesis: VsaHypothesis): LabeledConfidence {
  const score = anomalyMagnitude(hypothesis.signal.bar);
  return {
    kind: 'DETECTION',
    value: capped(score),
    explanation: `This bar's own volume (${hypothesis.signal.bar.volumeRatio.toFixed(2)}x trailing average) and spread (${hypothesis.signal.bar.spreadAtrRatio.toFixed(2)}x ATR) deviation from a perfectly average bar yields an anomaly magnitude of ${score.toFixed(0)} (0-100).`,
  };
}

/** Detection Confidence strengthened when this signal's own bar occurred at or near a recently identified swing high/low. */
export function buildInterpretationConfidence(hypothesis: VsaHypothesis): LabeledConfidence {
  const detection = anomalyMagnitude(hypothesis.signal.bar);
  const adjusted = hypothesis.swingProximate ? detection * SWING_PROXIMITY_MULTIPLIER : detection;
  return {
    kind: 'INTERPRETATION',
    value: capped(adjusted),
    explanation: hypothesis.swingProximate
      ? `Strengthened (${(SWING_PROXIMITY_MULTIPLIER * 100).toFixed(0)}% of Detection Confidence): this bar occurred at or near a recently identified swing high/low.`
      : "Unchanged: this bar did not occur near a recently identified swing high/low.",
  };
}

/**
 * The three wide-spread, high-volume "climax-type" signals (Upthrust,
 * Shakeout, Stopping Volume) strengthen when the Regime/Context
 * Service's own `volatilityState` reads `'HIGH'`, since a genuine climax
 * naturally co-occurs with volatility expansion -- corroborating rather
 * than contradicting it. The two narrow-spread, low-volume "quiet-type"
 * signals (No Demand, No Supply) strengthen when it reads `'LOW'`, since
 * a genuine "no interest" reading requires an already-quiet tape to be
 * meaningful. A genuinely distinct bifurcating variable -- signal
 * category -- from every prior Provider's own rule, even where the
 * underlying `volatilityState` axis is reused from other already-
 * registered Providers' own rules.
 */
export function buildRegimeAdjustedConfidence(hypothesis: VsaHypothesis, regimeResult: RegimeContextResult): LabeledConfidence {
  const interpretationValue = buildInterpretationConfidence(hypothesis).value.toNumber();
  const isClimax = isClimaxSignal(hypothesis.signal.type);
  const strengthenOn = isClimax ? 'HIGH' : 'LOW';
  const strengthened = regimeResult.volatilityState === strengthenOn;
  const multiplier = strengthened ? WITH_VOLATILITY_MULTIPLIER : AGAINST_VOLATILITY_MULTIPLIER;

  return {
    kind: 'REGIME_ADJUSTED',
    value: capped(interpretationValue * multiplier),
    explanation: strengthened
      ? `Strengthened (${(WITH_VOLATILITY_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): this ${isClimax ? 'climax-type' : 'quiet-type'} signal's own corroborating volatility condition (${regimeResult.volatilityState}) currently holds.`
      : `Weakened (${(AGAINST_VOLATILITY_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): this ${isClimax ? 'climax-type' : 'quiet-type'} signal's own corroborating volatility condition does not currently hold (reads ${regimeResult.volatilityState}).`,
  };
}

/** Constant per Provider, not per result -- this Provider's own disclosed ceiling, reported alongside every output. */
export function buildMethodologyConfidenceCeiling(): LabeledConfidence {
  return {
    kind: 'METHODOLOGY_CEILING',
    value: new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING),
    explanation:
      "This Provider's methodology traces to a single identifiable founder's own primary text, corroborated by a second identifiable author's own widely-cited text -- stronger sourcing than a fully decentralized multi-educator methodology, but a newer, less classically-settled body of work than the oldest registered methodologies -- an independently calibrated ceiling, reflecting neither full source-verified confidence nor the absence of any corroborating source.",
  };
}
