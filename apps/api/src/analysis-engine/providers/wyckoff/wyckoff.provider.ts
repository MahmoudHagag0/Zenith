import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import type { AnalysisProvider, AnalysisProviderResult, Interpretation, ProviderLifecycleState, ProviderTier } from '../analysis-provider.types';
import { INDICATOR_ENGINE, type IndicatorEngine } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR, type SwingDetector } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT, type RegimeContext } from '../../regime-context/regime-context.tokens';
import type { MarketSeries } from '../../market-series/market-series.types';
import { detectWyckoffRange } from './wyckoff-range.detector';
import { detectAccumulationEvents } from './wyckoff-accumulation.detector';
import { detectDistributionEvents } from './wyckoff-distribution.detector';
import { classifyWyckoffPhase } from './wyckoff-phase.classifier';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './wyckoff-confidence.util';
import { normalizeWyckoffResult } from './wyckoff-normalize.util';
import type { WyckoffSideEvents } from './wyckoff.types';
import type { NormalizedProviderOutput } from '../normalized-vocabulary.types';

const COMPUTATION_VERSION = '1.0.0';
const CONTRACT_VERSION = '1.0.0';

/**
 * Disclosed, named calibration constants (S1-009 Sprint Brief, Missing
 * Decisions) for the shared computation calls this Provider makes.
 */
const SWING_SENSITIVITY = 3;
const ADX_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_TRENDING_THRESHOLD = 25;
const VOLATILITY_MULTIPLIER = 1.5;
/** How many ATRs a Secondary Test/Test may be from the price it retests — an ATR-relative tolerance, not a fixed percentage. */
const NEAR_TOLERANCE_ATR_MULTIPLIER = 1.5;

/**
 * The Wyckoff Method Analysis Provider (S1-009) — the first real
 * `AnalysisProvider` (ADR-006), reading price structure through the
 * Wyckoff Method's Schematic #1 (Accumulation/Distribution) via the
 * shared, methodology-neutral computation substrate (S1-007) and
 * Provider contract (S1-008). Every Wyckoff-specific concept (ranges,
 * events, phases) lives only inside `providers/wyckoff/` — the shared
 * framework (`AnalysisProvider`, the Execution Engine, Lifecycle,
 * Confidence Model, Traceability, dependency system, observability)
 * remains generic and Wyckoff-agnostic, exactly as it must for every
 * future Provider (ICT/SMC, Elliott Wave, and others) to plug into
 * without modification.
 *
 * Tier `SLOW`: its phase-schematic reading is a bounded multi-hypothesis
 * search, the same category as Elliott Wave (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`,
 * Known Limitations) — it must never block a FAST-tier Provider's result.
 */
@Injectable()
export class WyckoffProvider implements AnalysisProvider {
  readonly id = 'WYCKOFF';
  readonly methodologyFamily = 'WYCKOFF';
  readonly computationVersion = COMPUTATION_VERSION;
  readonly lifecycleState: ProviderLifecycleState = 'ACTIVE';
  readonly tier: ProviderTier = 'SLOW';
  /** No Provider-to-Provider dependency — Wyckoff consumes shared computation (S1-007) directly, not another Provider's output. */
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

    const range = detectWyckoffRange(series.points, swingResult);
    if (!range) {
      return this.buildLimitationsResult(series, 'No identifiable trading range: insufficient swing structure in the supplied series.');
    }

    const atrResult = this.indicatorEngine.atr(series, { period: ATR_PERIOD });
    const latestAtr = atrResult.series[atrResult.series.length - 1]?.value ?? range.resistance.minus(range.support);
    const nearTolerance = latestAtr.times(NEAR_TOLERANCE_ATR_MULTIPLIER);

    const accumulation = detectAccumulationEvents(series.points, swingResult, range, nearTolerance);
    const distribution = detectDistributionEvents(series.points, swingResult, range, nearTolerance);
    // Both detectors are guaranteed at least their first event (PS/PSY) once
    // `range` is non-null, since detectWyckoffRange already required >=2
    // swing highs and >=2 swing lows -- the same precondition each
    // detector checks before pushing PS/PSY. `winningSide.events` is never
    // empty here.
    const winningSide: WyckoffSideEvents = accumulation.events.length >= distribution.events.length ? accumulation : distribution;

    const hypotheses = classifyWyckoffPhase(winningSide);
    const interpretation: Interpretation[] = hypotheses.map((hypothesis) => ({
      summary: hypothesis.summary,
      confidence: buildInterpretationConfidence(hypothesis),
      regimeAdjustedConfidence: buildRegimeAdjustedConfidence(hypothesis, regimeResult),
    }));

    const allEventTypesForSide = winningSide.side === 'ACCUMULATION' ? ['PS', 'SC', 'AR', 'ST', 'SPRING', 'TEST', 'SOS', 'LPS'] : ['PSY', 'BC', 'AR', 'ST', 'UT_UTAD', 'TEST', 'SOW', 'LPSY'];
    const detectedTypes = new Set(winningSide.events.map((event) => event.type));
    const missingConditions = allEventTypesForSide.filter((type) => !detectedTypes.has(type as never)).map((type) => `${type} not yet detected.`);

    return {
      contractVersion: CONTRACT_VERSION,
      evidence: {
        detectedConditions: winningSide.events.map((event) => event.description),
        missingConditions,
        supporting: winningSide.events.map((event) => event.description),
        conflicting: [],
      },
      interpretation,
      limitations: {
        dataQuality: series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [`Schematic side selected by whichever of Accumulation/Distribution detected more events (${winningSide.side}, ${winningSide.events.length} events).`],
        notes: [],
      },
      traceability: this.buildTraceability(swingResult, regimeResult, atrResult),
      detectionConfidence: buildDetectionConfidence(winningSide),
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  normalize(result: AnalysisProviderResult): NormalizedProviderOutput {
    return normalizeWyckoffResult(this.id, this.methodologyFamily, result);
  }

  private buildLimitationsResult(series: MarketSeries, note: string): AnalysisProviderResult {
    return {
      contractVersion: CONTRACT_VERSION,
      evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
      interpretation: [],
      limitations: {
        dataQuality: series.points.length === 0 ? 'MISSING' : series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [],
        notes: [note],
      },
      traceability: {
        rawDataReferences: [`MarketSeries for ${series.assetId}, ${series.points.length} points.`],
        intermediateCalculations: [],
        conditionDerivations: [note],
        confidenceDerivation: 'No confidence computed — no schematic identified.',
      },
      detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(0), explanation: note },
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  private buildTraceability(
    swingResult: ReturnType<SwingDetector['detect']>,
    regimeResult: ReturnType<RegimeContext['getRegime']>,
    atrResult: ReturnType<IndicatorEngine['atr']>,
  ) {
    return {
      rawDataReferences: [`SwingDetection input range: ${swingResult.swings.length} swings.`],
      intermediateCalculations: [
        { computation: swingResult.metadata.computation, computationVersion: swingResult.metadata.computationVersion },
        { computation: regimeResult.metadata.computation, computationVersion: regimeResult.metadata.computationVersion },
        { computation: atrResult.metadata.computation, computationVersion: atrResult.metadata.computationVersion },
      ],
      conditionDerivations: [`Regime read: ${regimeResult.trendState}/${regimeResult.volatilityState}.`],
      confidenceDerivation: `Interpretation Confidence from phase-hypothesis score; Regime-Adjusted Confidence scaled by trendState=${regimeResult.trendState}; Methodology Confidence Ceiling constant for WYCKOFF.`,
    };
  }
}
