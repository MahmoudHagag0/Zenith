import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import type { AnalysisProvider, AnalysisProviderResult, Interpretation, ProviderLifecycleState, ProviderTier } from '../analysis-provider.types';
import { INDICATOR_ENGINE, type IndicatorEngine } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR, type SwingDetector } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT, type RegimeContext } from '../../regime-context/regime-context.tokens';
import type { MarketSeries } from '../../market-series/market-series.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { ComputationOutput, IndicatorSeriesEntry } from '../../indicator-engine/indicator-engine.types';
import { classifyBar } from './vsa-bar-classifier.util';
import { CLIMAX_SIGNAL_TYPES, detectSignal, directionOf, isClimaxSignal } from './vsa-signal-detector.util';
import { MAX_VSA_HYPOTHESES, selectHypotheses } from './vsa-hypothesis.util';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './vsa-confidence.util';
import { normalizeVsaResult } from './vsa-normalize.util';
import type { VsaHypothesis, VsaSignal } from './vsa.types';
import type { NormalizedProviderOutput } from '../normalized-vocabulary.types';

const COMPUTATION_VERSION = '1.0.0';
const CONTRACT_VERSION = '1.0.0';

/**
 * Disclosed, named calibration constants (S1-018 Sprint Brief, Missing
 * Decisions) for the shared `REGIME_CONTEXT`/`SWING_DETECTOR` calls this
 * Provider makes. The swing sensitivity matches the value chosen for
 * every other registered Provider so `RegimeContextService`'s own
 * internal Swing Detection reads the same underlying structural
 * substrate consistently -- not because this Provider itself depends on
 * any of them (S1-018 Sprint Brief, Scope item 1; DEC-2026-022).
 */
const SWING_SENSITIVITY = 3;
const ADX_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_TRENDING_THRESHOLD = 25;
const VOLATILITY_MULTIPLIER = 1.5;

/**
 * Disclosed calibration (S1-018 Sprint Brief, Missing Decisions): the
 * shared window used both as the trailing-volume-baseline period and
 * the local-extreme lookback (Upthrust/Shakeout) -- a single, simpler
 * "recent price action" context window serves both purposes.
 */
const LOOKBACK_WINDOW = 10;

/** Disclosed calibration (S1-018 Sprint Brief, Missing Decisions): the bounded recent-bar window this Provider scans for qualifying signals. */
const MAX_BARS_FOR_VSA_SCAN = 15;

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

/**
 * The VSA (Volume Spread Analysis) Provider (S1-018) -- the ninth real
 * `AnalysisProvider` (ADR-006), reading each bar's own effort-vs-result
 * relationship: comparing that bar's own volume (the "effort" the
 * market expended) against the price spread it produced (the "result"
 * that effort achieved), together with where its own close fell within
 * its spread. Every VSA-specific concept lives only inside
 * `providers/vsa/` -- the shared framework (`AnalysisProvider`, the
 * Execution Engine, Lifecycle, Confidence Model, Traceability,
 * dependency system, observability, Confluence Engine) remains generic,
 * exactly as it must for every future Provider to plug in without
 * modification.
 *
 * Fully independent of every other registered Provider, most
 * importantly the earliest-registered, structurally-related methodology
 * this Sprint's own architecture prerequisite check (DEC-2026-022)
 * examined: no `dependsOn`, no shared internal types or utilities
 * imported from any other Provider's own module directory -- verified
 * mechanically by `vsa-independence-boundary.spec.ts`. Several of this
 * Provider's own named signals (Upthrust, Shakeout) reuse an earlier,
 * related methodology's own historically accurate terminology -- this
 * methodology's own founder built it directly atop that earlier
 * methodology's own principles, and this shared terminology is honestly
 * disclosed, never hidden -- but the detection mechanism itself operates
 * entirely at the single-bar level, never requiring a pre-identified
 * trading range or schematic phase.
 *
 * Tier `SLOW`: a bounded scan across a recent-bar window with per-bar
 * classification, the same tiering category as every other bounded-
 * multi-window-search Provider in this system.
 */
@Injectable()
export class VsaProvider implements AnalysisProvider {
  readonly id = 'VSA';
  readonly methodologyFamily = 'VSA';
  readonly computationVersion = COMPUTATION_VERSION;
  readonly lifecycleState: ProviderLifecycleState = 'ACTIVE';
  readonly tier: ProviderTier = 'SLOW';
  /** No Provider-to-Provider dependency -- this Provider consumes shared computation (S1-007) directly, never another Provider's output (DEC-2026-022). */
  readonly dependsOn = undefined;

  constructor(
    @Inject(INDICATOR_ENGINE) private readonly indicatorEngine: IndicatorEngine,
    @Inject(SWING_DETECTOR) private readonly swingDetector: SwingDetector,
    @Inject(REGIME_CONTEXT) private readonly regimeContext: RegimeContext,
  ) {}

  async analyze(series: MarketSeries): Promise<AnalysisProviderResult> {
    const regimeResult = this.regimeContext.getRegime(series, {
      adxPeriod: ADX_PERIOD,
      atrPeriod: ATR_PERIOD,
      swingSensitivity: SWING_SENSITIVITY,
      adxTrendingThreshold: ADX_TRENDING_THRESHOLD,
      volatilityMultiplier: VOLATILITY_MULTIPLIER,
    });
    const atrResult = this.indicatorEngine.atr(series, { period: ATR_PERIOD });
    const swingResult = this.swingDetector.detect(series, { sensitivity: SWING_SENSITIVITY });

    const points = series.points;
    if (points.length < LOOKBACK_WINDOW + 1) {
      return this.buildLimitationsResult(
        series,
        regimeResult,
        atrResult,
        swingResult,
        `At least ${LOOKBACK_WINDOW + 1} bars are required (a ${LOOKBACK_WINDOW}-bar lookback plus one classifiable bar); only ${points.length} were supplied.`,
      );
    }

    const scanStart = Math.max(LOOKBACK_WINDOW, points.length - MAX_BARS_FOR_VSA_SCAN);
    const signals: VsaSignal[] = [];

    for (let i = scanStart; i < points.length; i++) {
      const atr = findAtrAtOrBefore(atrResult.series, points[i].timestamp) ?? new Prisma.Decimal(0);
      const precedingPoints = points.slice(i - LOOKBACK_WINDOW, i);
      const classifiedBar = classifyBar(points[i], i, precedingPoints, atr);
      const signalType = detectSignal(classifiedBar, precedingPoints, regimeResult.trendDirection);
      if (signalType) {
        signals.push({ type: signalType, bar: classifiedBar });
      }
    }

    if (signals.length === 0) {
      return this.buildLimitationsResult(series, regimeResult, atrResult, swingResult, 'No qualifying VSA signal was found anywhere in the scanned window.');
    }

    const hypotheses = selectHypotheses(signals, swingResult.swings);

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
        assumptions: [`Primary reading synthesized from the most recent qualifying VSA signal within the scanned window; ${hypotheses.length} hypothesis(es) survived (bounded at ${MAX_VSA_HYPOTHESES}).`],
        notes: [],
      },
      traceability: this.buildTraceability(regimeResult, atrResult, swingResult),
      detectionConfidence: buildDetectionConfidence(primary),
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  normalize(result: AnalysisProviderResult): NormalizedProviderOutput {
    return normalizeVsaResult(this.id, this.methodologyFamily, result);
  }

  /**
   * Composes this hypothesis's disclosed summary: machine-parseable
   * `[SIGNAL:...]`/`[CATEGORY:...]`/`[DIRECTION:...]` tags (consumed
   * only by this Provider's own `normalize()` mapping, never by another
   * Provider), followed by the human-readable disclosure of why this
   * reading currently holds and what would invalidate it -- the same
   * transparency discipline established across every prior Provider in
   * this system.
   */
  private buildSummary(hypothesis: VsaHypothesis): string {
    const { signal, invalidation, swingProximate } = hypothesis;
    const category = isClimaxSignal(signal.type) ? 'CLIMAX' : 'QUIET';
    const direction = directionOf(signal);
    const proximityText = swingProximate
      ? 'This bar occurred at or near a recently identified swing high/low, strengthening its own significance.'
      : 'This bar did not occur near a recently identified swing high/low.';

    return [
      `[SIGNAL:${signal.type}] [CATEGORY:${category}] [DIRECTION:${direction}]`,
      `The strongest currently-surviving interpretation (not asserted as the objectively correct reading): a ${signal.type} bar at ${signal.bar.point.timestamp.toISOString()} (spread ${signal.bar.spread}, volume ${signal.bar.volume}, close position ${signal.bar.closePosition}).`,
      proximityText,
      invalidation.description,
    ].join(' ');
  }

  private buildEvidence(hypotheses: readonly VsaHypothesis[]) {
    const detectedConditions = hypotheses.map(
      (hypothesis) =>
        `${hypothesis.signal.type} at ${hypothesis.signal.bar.point.timestamp.toISOString()}: spread=${hypothesis.signal.bar.spread}, volume=${hypothesis.signal.bar.volume}, closePosition=${hypothesis.signal.bar.closePosition}.`,
    );

    const missingConditions: string[] = [];
    if (!hypotheses.some((hypothesis) => CLIMAX_SIGNAL_TYPES.includes(hypothesis.signal.type))) {
      missingConditions.push('No qualifying climax-type signal (Upthrust/Shakeout/Stopping Volume) found in the scanned window.');
    }
    if (!hypotheses.some((hypothesis) => hypothesis.signal.type === 'NO_DEMAND' || hypothesis.signal.type === 'NO_SUPPLY')) {
      missingConditions.push('No qualifying quiet-type signal (No Demand/No Supply) found in the scanned window.');
    }

    const supporting = hypotheses.map(
      (hypothesis) =>
        `${hypothesis.signal.bar.volumeRatio.toFixed(2)}x trailing average volume against a ${hypothesis.signal.bar.spreadAtrRatio.toFixed(2)}x-ATR spread is a genuine effort-vs-result anomaly.`,
    );

    return { detectedConditions, missingConditions, supporting, conflicting: [] };
  }

  private buildLimitationsResult(
    series: MarketSeries,
    regimeResult: RegimeContextResult,
    atrResult: ComputationOutput<Prisma.Decimal>,
    swingResult: SwingDetectionResult,
    note: string,
  ): AnalysisProviderResult {
    return {
      contractVersion: CONTRACT_VERSION,
      evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
      interpretation: [],
      limitations: {
        dataQuality: series.points.length === 0 ? 'MISSING' : series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [],
        notes: [note],
      },
      traceability: this.buildTraceability(regimeResult, atrResult, swingResult),
      detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(0), explanation: note },
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  private buildTraceability(regimeResult: RegimeContextResult, atrResult: ComputationOutput<Prisma.Decimal>, swingResult: SwingDetectionResult) {
    const intermediateCalculations = [
      { computation: regimeResult.metadata.computation, computationVersion: regimeResult.metadata.computationVersion },
      { computation: atrResult.metadata.computation, computationVersion: atrResult.metadata.computationVersion },
      { computation: swingResult.metadata.computation, computationVersion: swingResult.metadata.computationVersion },
    ];

    return {
      rawDataReferences: [`MarketSeries scanned for VSA signals within the most recent ${MAX_BARS_FOR_VSA_SCAN} bars.`],
      intermediateCalculations,
      conditionDerivations: [`Regime read: trendDirection=${regimeResult.trendDirection}, volatilityState=${regimeResult.volatilityState}.`],
      confidenceDerivation:
        "Interpretation Confidence from this bar's own anomaly magnitude, strengthened by swing proximity; Regime-Adjusted Confidence scaled by volatilityState, bifurcated by signal category (climax-type vs. quiet-type); Detection Confidence from this bar's own raw anomaly magnitude; Methodology Confidence Ceiling constant for VSA.",
    };
  }
}
