import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import type { AnalysisProvider, AnalysisProviderResult, Interpretation, ProviderLifecycleState, ProviderTier } from '../analysis-provider.types';
import { INDICATOR_ENGINE, type IndicatorEngine } from '../../indicator-engine/indicator-engine.tokens';
import { REGIME_CONTEXT, type RegimeContext } from '../../regime-context/regime-context.tokens';
import type { MarketSeries } from '../../market-series/market-series.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { ComputationOutput } from '../../indicator-engine/indicator-engine.types';
import { generateZoneCandidates } from './supply-demand-candidate-generator.util';
import { assessZoneHealth } from './supply-demand-zone-health.util';
import { scoreInterpretation, scoreZoneQuality } from './supply-demand-quality-scoring.util';
import { buildInvalidation, buildSurvivalReasons, buildWeaknesses, selectZoneHypotheses } from './supply-demand-hypothesis.util';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './supply-demand-confidence.util';
import { normalizeSupplyDemandResult } from './supply-demand-normalize.util';
import type { SupplyDemandZone } from './supply-demand.types';
import type { NormalizedProviderOutput } from '../normalized-vocabulary.types';

const COMPUTATION_VERSION = '1.0.0';
const CONTRACT_VERSION = '1.0.0';

/**
 * Disclosed, named calibration constants (S1-016 Sprint Brief, Missing
 * Decisions) for the shared `REGIME_CONTEXT` call this Provider makes.
 * The swing sensitivity matches the value chosen for every other
 * registered Provider so `RegimeContextService`'s own internal Swing
 * Detection reads the same underlying structural substrate consistently
 * -- not because this Provider itself depends on any of them (S1-016
 * Sprint Brief, Scope item 1).
 */
const SWING_SENSITIVITY = 3;
const ADX_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_TRENDING_THRESHOLD = 25;
const VOLATILITY_MULTIPLIER = 1.5;

/**
 * The Supply & Demand Analysis Provider (S1-016) -- the seventh real
 * `AnalysisProvider` (ADR-006), reading institutional Supply and Demand
 * zones: a consolidating base immediately followed by an impulsive
 * departure, each zone's own origin, quality, freshness, mitigation
 * status, strength, and probability of holding or failing on a future
 * test. Every Supply-and-Demand-specific concept lives only inside
 * `providers/supply-demand/` -- the shared framework (`AnalysisProvider`,
 * the Execution Engine, Lifecycle, Confidence Model, Traceability,
 * dependency system, observability, Confluence Engine) remains generic,
 * exactly as it must for every future Provider to plug in without
 * modification.
 *
 * Fully independent of every other registered Provider: no `dependsOn`,
 * no shared internal types or utilities imported from any other
 * Provider's own module directory -- verified mechanically by
 * `supply-demand-independence-boundary.spec.ts`. This Provider's own
 * base-and-departure detection is entirely self-contained, deliberately
 * never reusing another registered Provider's own displacement/order-
 * block logic despite a shared retail-trading lineage.
 *
 * Tier `SLOW`: a bounded linear scan across candle-count windows for
 * base candidates, the same tiering category as every other bounded-
 * multi-window-search Provider in this system.
 *
 * The first Provider not to inject `SWING_DETECTOR` directly: its own
 * raw evidence (a base of consolidating candles followed by an
 * impulsive departure) is assessed entirely at the candle level, never
 * the swing-point level; `RegimeContextService` already composes Swing
 * Detection internally for its own trend read.
 */
@Injectable()
export class SupplyDemandProvider implements AnalysisProvider {
  readonly id = 'SUPPLY_DEMAND';
  readonly methodologyFamily = 'SUPPLY_DEMAND';
  readonly computationVersion = COMPUTATION_VERSION;
  readonly lifecycleState: ProviderLifecycleState = 'ACTIVE';
  readonly tier: ProviderTier = 'SLOW';
  /** No Provider-to-Provider dependency -- this Provider consumes shared computation (S1-007) directly, never another Provider's output. */
  readonly dependsOn = undefined;

  constructor(
    @Inject(INDICATOR_ENGINE) private readonly indicatorEngine: IndicatorEngine,
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

    const rawCandidates = generateZoneCandidates(series, atrResult.series);
    if (rawCandidates.length === 0) {
      return this.buildLimitationsResult(series, regimeResult, atrResult, 'No base-and-departure candidate was found anywhere in the supplied series.');
    }

    const currentPrice = series.points[series.points.length - 1].close;

    const zones: SupplyDemandZone[] = rawCandidates.map((candidate) => {
      const subsequentPoints = series.points.filter((point) => point.timestamp.getTime() > candidate.departureCandle.timestamp.getTime());
      const health = assessZoneHealth(candidate, subsequentPoints);
      const qualityScore = scoreZoneQuality(candidate, atrResult.series);
      const interpretationScore = scoreInterpretation(qualityScore, health.freshness, health.mitigation);
      const invalidation = buildInvalidation(candidate);

      const draft: SupplyDemandZone = {
        type: candidate.type,
        origin: candidate.origin,
        boundaries: candidate.boundaries,
        departureCandle: candidate.departureCandle,
        freshness: health.freshness,
        mitigation: health.mitigation,
        qualityScore,
        interpretationScore,
        invalidation,
        survivalReasons: [],
        weaknesses: [],
      };
      return { ...draft, survivalReasons: buildSurvivalReasons(draft), weaknesses: buildWeaknesses(draft) };
    });

    const hypotheses = selectZoneHypotheses(zones, currentPrice);

    const interpretation: Interpretation[] = hypotheses.map((zone) => ({
      summary: this.buildSummary(zone),
      confidence: buildInterpretationConfidence(zone),
      regimeAdjustedConfidence: buildRegimeAdjustedConfidence(zone, regimeResult),
    }));

    const primary = hypotheses[0];

    return {
      contractVersion: CONTRACT_VERSION,
      evidence: this.buildEvidence(hypotheses),
      interpretation,
      limitations: {
        dataQuality: series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [`Primary reading synthesized from the zone nearest to current price; ${hypotheses.length} hypothesis(es) survived (one per side, at most).`],
        notes: [],
      },
      traceability: this.buildTraceability(regimeResult, atrResult),
      detectionConfidence: buildDetectionConfidence(primary),
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  normalize(result: AnalysisProviderResult): NormalizedProviderOutput {
    return normalizeSupplyDemandResult(this.id, this.methodologyFamily, result);
  }

  /**
   * Composes this zone's disclosed summary: machine-parseable
   * `[TYPE:...]`/`[FRESHNESS:...]`/`[MITIGATION:...]` tags (consumed
   * only by this Provider's own `normalize()` mapping, never by another
   * Provider), followed by the human-readable disclosure of why this
   * reading currently holds, what weakens it, and what would invalidate
   * it -- the same transparency discipline established across every
   * prior Provider in this system.
   */
  private buildSummary(zone: SupplyDemandZone): string {
    const weaknessText = zone.weaknesses.length > 0 ? zone.weaknesses.join(' ') : 'No material weakness identified in this reading.';
    return [
      `[TYPE:${zone.type}] [FRESHNESS:${zone.freshness}] [MITIGATION:${zone.mitigation}]`,
      `The strongest currently-surviving interpretation (not asserted as the objectively correct reading): a ${zone.type} zone (${zone.origin}) bounded by ${zone.boundaries.proximal.toFixed(2)} (proximal) and ${zone.boundaries.distal.toFixed(2)} (distal).`,
      zone.survivalReasons.join(' '),
      weaknessText,
      zone.invalidation.description,
    ].join(' ');
  }

  private buildEvidence(hypotheses: readonly SupplyDemandZone[]) {
    const primary = hypotheses[0];
    const detectedConditions = hypotheses.map(
      (zone) => `${zone.type} zone (${zone.origin}): proximal ${zone.boundaries.proximal.toFixed(2)}, distal ${zone.boundaries.distal.toFixed(2)}, departure at ${zone.departureCandle.timestamp.toISOString()}.`,
    );

    const missingConditions: string[] = [];
    if (!hypotheses.some((zone) => zone.type === 'DEMAND')) missingConditions.push('No qualifying DEMAND zone found below current price.');
    if (!hypotheses.some((zone) => zone.type === 'SUPPLY')) missingConditions.push('No qualifying SUPPLY zone found above current price.');

    return {
      detectedConditions,
      missingConditions,
      supporting: [...primary.survivalReasons],
      conflicting: hypotheses.flatMap((zone) => zone.weaknesses),
    };
  }

  private buildLimitationsResult(series: MarketSeries, regimeResult: RegimeContextResult, atrResult: ComputationOutput<Prisma.Decimal>, note: string): AnalysisProviderResult {
    return {
      contractVersion: CONTRACT_VERSION,
      evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
      interpretation: [],
      limitations: {
        dataQuality: series.points.length === 0 ? 'MISSING' : series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [],
        notes: [note],
      },
      traceability: this.buildTraceability(regimeResult, atrResult),
      detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(0), explanation: note },
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  private buildTraceability(regimeResult: RegimeContextResult, atrResult: ComputationOutput<Prisma.Decimal>) {
    const intermediateCalculations = [
      { computation: regimeResult.metadata.computation, computationVersion: regimeResult.metadata.computationVersion },
      { computation: atrResult.metadata.computation, computationVersion: atrResult.metadata.computationVersion },
    ];

    return {
      rawDataReferences: [`MarketSeries scanned for base-and-departure candidates.`],
      intermediateCalculations,
      conditionDerivations: [`Regime read: trendDirection=${regimeResult.trendDirection}, trendState=${regimeResult.trendState}.`],
      confidenceDerivation: `Interpretation Confidence from freshness/mitigation-decayed quality score; Regime-Adjusted Confidence scaled by trendDirection=${regimeResult.trendDirection}, bifurcated by zone type; Detection Confidence from this zone's own weakest-link quality margin; Methodology Confidence Ceiling constant for SUPPLY_DEMAND.`,
    };
  }
}
