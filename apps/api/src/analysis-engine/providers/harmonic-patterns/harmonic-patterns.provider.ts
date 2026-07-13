import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import type { AnalysisProvider, AnalysisProviderResult, Interpretation, ProviderLifecycleState, ProviderTier } from '../analysis-provider.types';
import { SWING_DETECTOR, type SwingDetector } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT, type RegimeContext } from '../../regime-context/regime-context.tokens';
import type { MarketSeries } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import { generateHarmonicCandidates } from './harmonic-patterns-candidate-generator.util';
import { matchPatternTypes } from './harmonic-patterns-band-matching.util';
import { scoreInterpretation } from './harmonic-patterns-interpretation-scoring.util';
import { finalizeHarmonicHypotheses } from './harmonic-patterns-hypothesis.util';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './harmonic-patterns-confidence.util';
import { normalizeHarmonicPatternsResult } from './harmonic-patterns-normalize.util';
import type { HarmonicPatternCandidate } from './harmonic-patterns.types';
import type { NormalizedProviderOutput } from '../normalized-vocabulary.types';

const COMPUTATION_VERSION = '1.0.0';
const CONTRACT_VERSION = '1.0.0';

/**
 * Disclosed, named calibration constant (S1-013 Sprint Brief, Missing
 * Decisions) for the shared computation call this Provider makes. The
 * swing sensitivity matches the value chosen for all three prior
 * Providers so every Provider reads the same underlying structural
 * substrate consistently — not because this Provider depends on any of
 * them (S1-013 Sprint Brief, Scope item 2).
 */
const SWING_SENSITIVITY = 3;
const ADX_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_TRENDING_THRESHOLD = 25;
const VOLATILITY_MULTIPLIER = 1.5;

/** A time-symmetry score at or above this is disclosed, in this Provider's own summary text, as "confirmed AB=CD time symmetry" -- the basis `normalize()` (S1-012) reads to gate CONFIRMATION honestly. */
const TIME_SYMMETRY_CONFIRMATION_THRESHOLD = 60;

/**
 * The Harmonic Patterns Analysis Provider (S1-013) — the fourth real
 * `AnalysisProvider` (ADR-006), reading precise Fibonacci-ratio geometry
 * across five pivot points (X, A, B, C, D) over the shared,
 * methodology-neutral computation substrate (S1-007) and Provider
 * contract (S1-008). Every Harmonic-Patterns-specific concept lives only
 * inside `providers/harmonic-patterns/` — the shared framework
 * (`AnalysisProvider`, the Execution Engine, Lifecycle, Confidence Model,
 * Traceability, dependency system, observability, Confluence Engine)
 * remains generic, exactly as it must for every future Provider to plug
 * in without modification.
 *
 * Fully independent of every other registered Provider: no `dependsOn`,
 * no shared internal types or utilities imported from any other
 * Provider's own module directory — verified mechanically by
 * `harmonic-patterns-independence-boundary.spec.ts`.
 *
 * Tier `SLOW`: a bounded multi-hypothesis search, the same tiering
 * category as every other slow, bounded-search Provider in this system.
 *
 * Deliberately does not inject `INDICATOR_ENGINE` — this Provider
 * computes its own leg ratios directly via `Prisma.Decimal` division
 * (`harmonic-patterns-ratio-tables.util.ts`), since each of its four
 * ratios has its own distinct, sequentially-chained anchor-leg pair, not
 * the single anchor pair `fibonacciLevels()` was designed for.
 */
@Injectable()
export class HarmonicPatternsProvider implements AnalysisProvider {
  readonly id = 'HARMONIC_PATTERNS';
  readonly methodologyFamily = 'HARMONIC_PATTERNS';
  readonly computationVersion = COMPUTATION_VERSION;
  readonly lifecycleState: ProviderLifecycleState = 'ACTIVE';
  readonly tier: ProviderTier = 'SLOW';
  /** No Provider-to-Provider dependency -- this Provider consumes shared computation (S1-007) directly, never another Provider's output. */
  readonly dependsOn = undefined;

  constructor(
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

    const rawCandidates = generateHarmonicCandidates(swingResult);
    const matchedCandidates = rawCandidates.flatMap((candidate) => matchPatternTypes(candidate));

    if (matchedCandidates.length === 0) {
      return this.buildLimitationsResult(series, swingResult, regimeResult, 'No candidate 5-point (X, A, B, C, D) structure matched any of the four named pattern ratio tables in the supplied series.');
    }

    const scoredCandidates = matchedCandidates.map((candidate) => scoreInterpretation(candidate));
    const hypotheses = finalizeHarmonicHypotheses(scoredCandidates);

    const interpretation: Interpretation[] = hypotheses.map((hypothesis) => ({
      summary: this.buildSummary(hypothesis),
      confidence: buildInterpretationConfidence(hypothesis),
      regimeAdjustedConfidence: buildRegimeAdjustedConfidence(hypothesis, regimeResult),
    }));

    const primary = hypotheses[0];

    return {
      contractVersion: CONTRACT_VERSION,
      evidence: this.buildEvidence(hypotheses),
      interpretation,
      limitations: {
        dataQuality: series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [`Primary reading synthesized from a ${primary.patternType} match; ${hypotheses.length} hypothesis(es) survived band matching and are ranked by ideal-ratio proximity and AB=CD time symmetry.`],
        notes: [],
      },
      traceability: this.buildTraceability(swingResult, regimeResult),
      detectionConfidence: buildDetectionConfidence(primary),
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  normalize(result: AnalysisProviderResult): NormalizedProviderOutput {
    return normalizeHarmonicPatternsResult(this.id, this.methodologyFamily, result);
  }

  /**
   * Composes each hypothesis's disclosed summary: which pattern type
   * matched and why, what weakens it, and what would invalidate it — the
   * same three-part transparency discipline established across every
   * prior bounded-hypothesis Provider in this system.
   */
  private buildSummary(hypothesis: HarmonicPatternCandidate): string {
    const weaknessText = hypothesis.weaknesses.length > 0 ? hypothesis.weaknesses.join(' ') : 'No material weakness identified in this reading.';
    // Worded so the negative case is never a substring superset of the positive phrase
    // ("confirmed AB=CD time symmetry") -- normalize() (WP10) matches on that exact phrase.
    const timeSymmetryText =
      hypothesis.timeSymmetryScore >= TIME_SYMMETRY_CONFIRMATION_THRESHOLD
        ? 'with confirmed AB=CD time symmetry'
        : 'with AB=CD time symmetry not confirmed';
    return [
      `The strongest currently-surviving interpretation (not asserted as the objectively correct reading): a ${hypothesis.direction} ${hypothesis.patternType} pattern, ${timeSymmetryText}.`,
      hypothesis.survivalReasons.join(' '),
      weaknessText,
      hypothesis.invalidation.description,
    ].join(' ');
  }

  private buildEvidence(hypotheses: readonly HarmonicPatternCandidate[]) {
    const primary = hypotheses[0];
    const detectedConditions = primary.ratioChecks.map(
      (check) => `${check.label} ratio ${check.actualRatio.toFixed(3)} matches ${primary.patternType}'s own band [${check.band.min}-${check.band.max}].`,
    );

    return {
      detectedConditions,
      missingConditions: [],
      supporting: [...primary.survivalReasons],
      conflicting: hypotheses.length > 1 ? [`An alternate, comparably-ranked ${hypotheses[1].patternType} interpretation also currently survives -- see interpretation[] for its own disclosure.`] : [],
    };
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

  private buildTraceability(swingResult: SwingDetectionResult, regimeResult: RegimeContextResult) {
    const intermediateCalculations = [
      { computation: swingResult.metadata.computation, computationVersion: swingResult.metadata.computationVersion },
      { computation: regimeResult.metadata.computation, computationVersion: regimeResult.metadata.computationVersion },
    ];

    return {
      rawDataReferences: [`SwingDetection input range: ${swingResult.swings.length} swings.`],
      intermediateCalculations,
      conditionDerivations: [`Regime read: ${regimeResult.trendState}/${regimeResult.volatilityState}.`],
      confidenceDerivation: `Interpretation Confidence from ideal-ratio proximity and AB=CD time symmetry; Regime-Adjusted Confidence scaled by volatilityState=${regimeResult.volatilityState}; Detection Confidence from the weakest ratio-band margin; Methodology Confidence Ceiling constant for HARMONIC_PATTERNS.`,
    };
  }
}
