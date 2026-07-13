import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import type { AnalysisProvider, AnalysisProviderResult, Interpretation, ProviderLifecycleState, ProviderTier } from '../analysis-provider.types';
import { INDICATOR_ENGINE, type IndicatorEngine } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR, type SwingDetector } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT, type RegimeContext } from '../../regime-context/regime-context.tokens';
import type { MarketSeries } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { ComputationOutput } from '../../indicator-engine/indicator-engine.types';
import { gatherSubsequentPoints, identifyKeyLevel } from './price-action-level-identification.util';
import { classifyReaction, directionFor } from './price-action-reaction-classifier.util';
import { scoreQuality } from './price-action-quality-scoring.util';
import { scoreContinuationPace, scoreMomentum } from './price-action-momentum.util';
import { ALTERNATE_CONFIDENCE_FRACTION, buildInvalidation, buildSurvivalReasons, buildWeaknesses, determineAlternate, type AlternateReading } from './price-action-hypothesis.util';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './price-action-confidence.util';
import { normalizePriceActionResult } from './price-action-normalize.util';
import type { KeyLevel, PriceActionReading } from './price-action.types';
import type { NormalizedProviderOutput } from '../normalized-vocabulary.types';

const COMPUTATION_VERSION = '1.0.0';
const CONTRACT_VERSION = '1.0.0';

/**
 * Disclosed, named calibration constants (S1-015 Sprint Brief, Missing
 * Decisions) for the shared computation calls this Provider makes. The
 * swing sensitivity matches the value chosen for every other registered
 * Provider so every Provider reads the same underlying structural
 * substrate consistently -- not because this Provider depends on any of
 * them (S1-015 Sprint Brief, Scope item 2).
 */
const SWING_SENSITIVITY = 3;
const ADX_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_TRENDING_THRESHOLD = 25;
const VOLATILITY_MULTIPLIER = 1.5;

/**
 * The Price Action Analysis Provider (S1-015) -- the sixth real
 * `AnalysisProvider` (ADR-006), reading how price behaves around its own
 * single, most recent key level: rejection strength, breakout quality,
 * retest quality, momentum, and continuation versus exhaustion. This
 * Provider's own focus is market behavior, not named candlestick
 * patterns or reversal/continuation shapes -- every concept here is a
 * disclosed measurement (a wick-to-range ratio, a body-to-range ratio, an
 * ATR-relative clearance), never a pattern-name lookup. Every Price-
 * Action-specific concept lives only inside `providers/price-action/` --
 * the shared framework (`AnalysisProvider`, the Execution Engine,
 * Lifecycle, Confidence Model, Traceability, dependency system,
 * observability, Confluence Engine) remains generic, exactly as it must
 * for every future Provider to plug in without modification.
 *
 * Fully independent of every other registered Provider: no `dependsOn`,
 * no shared internal types or utilities imported from any other
 * Provider's own module directory -- verified mechanically by
 * `price-action-independence-boundary.spec.ts`.
 *
 * Tier `FAST`: a single-pass classification over one key level, the same
 * tiering basis as every other single-pass Provider in this system --
 * never a bounded multi-window search.
 *
 * The first Provider to inject `INDICATOR_ENGINE`, `SWING_DETECTOR`, and
 * `REGIME_CONTEXT` together: its own quality and momentum scoring is
 * genuinely ATR-relative, consumed directly rather than only via the
 * Regime/Context Service's own internal use of it.
 */
@Injectable()
export class PriceActionProvider implements AnalysisProvider {
  readonly id = 'PRICE_ACTION';
  readonly methodologyFamily = 'PRICE_ACTION';
  readonly computationVersion = COMPUTATION_VERSION;
  readonly lifecycleState: ProviderLifecycleState = 'ACTIVE';
  readonly tier: ProviderTier = 'FAST';
  /** No Provider-to-Provider dependency -- this Provider consumes shared computation (S1-007) directly, never another Provider's output. */
  readonly dependsOn = undefined;

  constructor(
    @Inject(INDICATOR_ENGINE) private readonly indicatorEngine: IndicatorEngine,
    @Inject(SWING_DETECTOR) private readonly swingDetector: SwingDetector,
    @Inject(REGIME_CONTEXT) private readonly regimeContext: RegimeContext,
  ) {}

  async analyze(series: MarketSeries): Promise<AnalysisProviderResult> {
    const swingResult = this.swingDetector.detect(series, { sensitivity: SWING_SENSITIVITY });
    const regimeResult = this.regimeContext.getRegime(series, {
      adxPeriod: ADX_PERIOD,
      atrPeriod: ATR_PERIOD,
      swingSensitivity: SWING_SENSITIVITY,
      adxTrendingThreshold: ADX_TRENDING_THRESHOLD,
      volatilityMultiplier: VOLATILITY_MULTIPLIER,
    });

    const keyLevel = identifyKeyLevel(swingResult);
    if (!keyLevel) {
      return this.buildLimitationsResult(series, swingResult, regimeResult, 'No swing exists in the supplied series; no key level exists to reason about.');
    }

    const subsequentPoints = gatherSubsequentPoints(series, keyLevel);
    if (subsequentPoints.length === 0) {
      return this.buildLimitationsResult(
        series,
        swingResult,
        regimeResult,
        `The most recent ${keyLevel.type} key level at ${keyLevel.price.toFixed(2)} has no subsequent points to react to.`,
      );
    }

    const atrResult = this.indicatorEngine.atr(series, { period: ATR_PERIOD });
    const classification = classifyReaction(keyLevel, subsequentPoints);
    const direction = directionFor(classification.state, keyLevel);
    const qualityScore = scoreQuality(classification, keyLevel, atrResult.series);
    const latestPoint = subsequentPoints[subsequentPoints.length - 1];
    const momentumScore = scoreMomentum(classification.state, classification.breakoutPoint, latestPoint, atrResult.series);
    const pointsFromBreakout = classification.breakoutPoint
      ? subsequentPoints.filter((point) => point.timestamp.getTime() >= classification.breakoutPoint!.timestamp.getTime())
      : [];
    const continuationPace = scoreContinuationPace(classification.state, pointsFromBreakout);
    const invalidation = buildInvalidation(classification, keyLevel);

    const draftReading: PriceActionReading = {
      state: classification.state,
      direction,
      keyLevel,
      classification,
      qualityScore,
      momentumScore,
      continuationPace,
      invalidation,
      survivalReasons: [],
      weaknesses: [],
    };
    const reading: PriceActionReading = {
      ...draftReading,
      survivalReasons: buildSurvivalReasons(draftReading),
      weaknesses: buildWeaknesses(draftReading),
    };

    const primaryInterpretationConfidence = buildInterpretationConfidence(reading);
    const primaryRegimeAdjustedConfidence = buildRegimeAdjustedConfidence(reading, regimeResult);
    const interpretation: Interpretation[] = [
      {
        summary: this.buildSummary(reading),
        confidence: primaryInterpretationConfidence,
        regimeAdjustedConfidence: primaryRegimeAdjustedConfidence,
      },
    ];

    const alternate = determineAlternate(classification, keyLevel, atrResult.series);
    if (alternate) {
      interpretation.push({
        summary: this.buildAlternateSummary(alternate, keyLevel),
        confidence: {
          kind: 'INTERPRETATION',
          value: primaryInterpretationConfidence.value.times(ALTERNATE_CONFIDENCE_FRACTION),
          explanation: `${(ALTERNATE_CONFIDENCE_FRACTION * 100).toFixed(0)}% of the primary reading's own Interpretation Confidence -- a boundary-proximity alternate, always weaker than the decisive primary reading.`,
        },
        regimeAdjustedConfidence: {
          kind: 'REGIME_ADJUSTED',
          value: primaryRegimeAdjustedConfidence.value.times(ALTERNATE_CONFIDENCE_FRACTION),
          explanation: `${(ALTERNATE_CONFIDENCE_FRACTION * 100).toFixed(0)}% of the primary reading's own Regime-Adjusted Confidence, for the same reason.`,
        },
      });
    }

    return {
      contractVersion: CONTRACT_VERSION,
      evidence: this.buildEvidence(reading, alternate),
      interpretation,
      limitations: {
        dataQuality: series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [
          `Primary reading synthesized from the single most recent ${keyLevel.type} key level, classified via a deterministic sequential scan of ${subsequentPoints.length} subsequent point(s).`,
        ],
        notes: [],
      },
      traceability: this.buildTraceability(swingResult, regimeResult, atrResult),
      detectionConfidence: buildDetectionConfidence(reading),
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  normalize(result: AnalysisProviderResult): NormalizedProviderOutput {
    return normalizePriceActionResult(this.id, this.methodologyFamily, result);
  }

  /**
   * Composes this reading's disclosed summary: machine-parseable
   * `[STATE:...]`/`[DIRECTION:...]`/`[MOMENTUM_SCORE:...]` tags (consumed
   * only by this Provider's own `normalize()` mapping, never by another
   * Provider), followed by the human-readable disclosure of why this
   * reading currently holds, what weakens it, and what would invalidate
   * it -- the same transparency discipline established across every
   * prior Provider in this system.
   */
  private buildSummary(reading: PriceActionReading): string {
    const weaknessText = reading.weaknesses.length > 0 ? reading.weaknesses.join(' ') : 'No material weakness identified in this reading.';
    return [
      `[STATE:${reading.state}] [DIRECTION:${reading.direction}] [MOMENTUM_SCORE:${reading.momentumScore.toFixed(0)}]`,
      `The strongest currently-surviving interpretation (not asserted as the objectively correct reading): a ${reading.direction} ${reading.state} at the ${reading.keyLevel.type} key level ${reading.keyLevel.price.toFixed(2)} (set ${reading.keyLevel.timestamp.toISOString()}).`,
      reading.survivalReasons.join(' '),
      weaknessText,
      reading.invalidation.description,
    ].join(' ');
  }

  private buildAlternateSummary(alternate: AlternateReading, keyLevel: KeyLevel): string {
    const direction = directionFor(alternate.state, keyLevel);
    return [
      `[STATE:${alternate.state}] [DIRECTION:${direction}] [MOMENTUM_SCORE:0]`,
      `An alternate, boundary-proximity interpretation: the primary reading's own decisive close came within ${alternate.marginAtr.toFixed(2)}x ATR of the key level ${keyLevel.price.toFixed(2)} -- a ${alternate.state} reading also currently remains plausible, though weaker than the primary.`,
    ].join(' ');
  }

  private buildEvidence(reading: PriceActionReading, alternate: AlternateReading | null) {
    const detectedConditions = [`Key level: ${reading.keyLevel.type} at ${reading.keyLevel.price.toFixed(2)}, set ${reading.keyLevel.timestamp.toISOString()}.`];
    const decisivePoint = reading.classification.breakoutPoint ?? reading.classification.rejectionPoint;
    if (decisivePoint) {
      detectedConditions.push(`Decisive point at ${decisivePoint.timestamp.toISOString()}: close ${decisivePoint.close.toFixed(2)}.`);
    }
    if (reading.classification.retestPoint) {
      detectedConditions.push(`Retest point at ${reading.classification.retestPoint.timestamp.toISOString()}: close ${reading.classification.retestPoint.close.toFixed(2)}.`);
    }

    const missingConditions: string[] = [];
    if (reading.state === 'APPROACHING_LEVEL') {
      missingConditions.push('Price has not yet reached the key level.');
    }
    if (reading.continuationPace === null && reading.classification.breakoutPoint) {
      missingConditions.push('Fewer than the disclosed minimum count of post-breakout points exist to assess continuation vs exhaustion.');
    }

    const conflicting = [...reading.weaknesses];
    if (alternate) {
      conflicting.push(`A boundary-proximity alternate (${alternate.state}) also currently remains plausible -- see interpretation[] for its own disclosure.`);
    }

    return { detectedConditions, missingConditions, supporting: [...reading.survivalReasons], conflicting };
  }

  private buildLimitationsResult(series: MarketSeries, swingResult: SwingDetectionResult, regimeResult: RegimeContextResult, note: string): AnalysisProviderResult {
    return {
      contractVersion: CONTRACT_VERSION,
      evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
      interpretation: [],
      limitations: {
        dataQuality: series.points.length === 0 ? 'MISSING' : series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [],
        notes: [note],
      },
      traceability: this.buildTraceability(swingResult, regimeResult),
      detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(0), explanation: note },
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  private buildTraceability(swingResult: SwingDetectionResult, regimeResult: RegimeContextResult, atrResult?: ComputationOutput<Prisma.Decimal>) {
    const intermediateCalculations = [
      { computation: swingResult.metadata.computation, computationVersion: swingResult.metadata.computationVersion },
      { computation: regimeResult.metadata.computation, computationVersion: regimeResult.metadata.computationVersion },
    ];
    if (atrResult) {
      intermediateCalculations.push({ computation: atrResult.metadata.computation, computationVersion: atrResult.metadata.computationVersion });
    }

    return {
      rawDataReferences: [`SwingDetection input range: ${swingResult.swings.length} swings.`],
      intermediateCalculations,
      conditionDerivations: [`Regime read: ${regimeResult.trendState}/${regimeResult.volatilityState}.`],
      confidenceDerivation: `Interpretation Confidence blends this reading's own quality and momentum scores for directional states; Regime-Adjusted Confidence scaled by volatilityState=${regimeResult.volatilityState}, bifurcated by reading type; Detection Confidence from this reading's own quality score; Methodology Confidence Ceiling constant for PRICE_ACTION.`,
    };
  }
}
