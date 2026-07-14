import { Inject, Injectable } from '@nestjs/common';
import { MarketSeriesService } from '../analysis-engine/market-series/market-series.service';
import { CONFLUENCE_ENGINE } from '../analysis-engine/confluence/confluence.tokens';
import type { ConfluenceEngine } from '../analysis-engine/confluence/confluence.tokens';
import type { ParticipatingProviderResult } from '../analysis-engine/confluence/confluence.types';
import type { Interpretation } from '../analysis-engine/providers/analysis-provider.types';
import { ComputationCacheService } from '../analysis-engine/common/computation-cache.service';
import { deriveNetDirection } from './net-direction-ranking.util';
import type { ContributingProviderView, InstrumentReading } from './dashboard.types';

const DAY_MS = 24 * 60 * 60 * 1000;

// Missing Decision 1 (S1-019 Sprint Brief): no prior document specifies a
// default historical window. 180 calendar days of daily candles gives every
// registered Provider's own internal lookback/window requirement (the
// largest being well under 100 bars) generous margin; a Provider still
// facing insufficient bars degrades gracefully via its own existing
// Limitations/non-participation reporting (ADR-006) rather than this
// Consumer needing to know any Provider's own minimum bar count.
const DEFAULT_LOOKBACK_DAYS = 180;

// Missing Decision 2: bounds payload size and Dashboard information density
// (`27_ZENITH_EXPERIENCE_LANGUAGE.md` §3.1) -- a trader is never shown more
// contributing Providers than this per instrument.
const MAX_TOP_CONTRIBUTORS = 5;

// Missing Decision 4: short enough that a Dashboard load never serves a
// meaningfully stale reading, long enough to absorb a burst of related
// requests (Decision Center + a future Watchlist/Portfolio annotation
// reading the same instrument) without recomputing -- the same order of
// magnitude as `ComputationCacheService`'s own existing 60s default.
const READING_CACHE_TTL_MS = 30_000;

/**
 * The Confluence Engine Consumer proper (S1-019 Sprint Brief, Scope item 2).
 * For one `assetId`, synthesizes a Dashboard-ready `InstrumentReading` from
 * the existing `MarketSeriesService` and the Confluence Engine's own
 * `computeConfluenceWithEvidence()` (S1-019 WP1) -- never re-deriving
 * dimension aggregation, never fabricating agreement for a non-participating
 * Provider, never collapsing the four-part Confidence taxonomy into one
 * number (Constitution §6.5, §12.6, §12.7).
 */
@Injectable()
export class InstrumentReadingService {
  private readonly cache = new ComputationCacheService();

  constructor(
    private readonly marketSeriesService: MarketSeriesService,
    @Inject(CONFLUENCE_ENGINE) private readonly confluenceEngine: ConfluenceEngine,
  ) {}

  async getInstrumentReading(assetId: string): Promise<InstrumentReading> {
    const cacheKey = this.cache.buildKey('dashboard-instrument-reading', {}, assetId, { from: null, to: null });
    const cached = this.cache.get<InstrumentReading>(cacheKey);
    if (cached) return cached;

    const to = new Date();
    const from = new Date(to.getTime() - DEFAULT_LOOKBACK_DAYS * DAY_MS);
    const series = await this.marketSeriesService.getSeries(assetId, from, to);
    const { confluence, providerResults } = await this.confluenceEngine.computeConfluenceWithEvidence(series);

    // Computed from the raw `confluence.dimensions` (still carrying per-dimension
    // contributors) BEFORE reshaping to `DimensionConfluenceView` below, which
    // deliberately drops that detail from the public response.
    const netDirectionResult = deriveNetDirection(confluence.dimensions);

    const reading: InstrumentReading = {
      assetId,
      computedAt: to.toISOString(),
      dimensions: confluence.dimensions.map((dimension) => ({
        dimension: dimension.dimension,
        aggregateReading: dimension.aggregateReading,
        disagreement: dimension.disagreement,
      })),
      participation: {
        participatingCount: confluence.participation.participating.length,
        totalRegistered: confluence.participation.participating.length + confluence.participation.nonParticipating.length,
        nonParticipating: confluence.participation.nonParticipating,
      },
      topContributors: this.selectTopContributors(providerResults),
      netDirection: netDirectionResult.netDirection,
      relevanceScore: netDirectionResult.relevanceScore,
      agreeingDimensions: netDirectionResult.agreeingDimensions,
      disagreementDimensions: netDirectionResult.disagreementDimensions,
    };

    this.cache.set(cacheKey, reading, READING_CACHE_TTL_MS);
    return reading;
  }

  private selectTopContributors(providerResults: readonly ParticipatingProviderResult[]): ContributingProviderView[] {
    return providerResults
      .map((providerResult) => this.toContributingProviderView(providerResult))
      // A Provider with no interpretation at all has nothing to summarize; excluded from the
      // bounded top-contributor list, but its participation is still counted (see `participation` above).
      .filter((view): view is ContributingProviderView => view !== undefined)
      .sort((a, b) => b.detectionConfidence.value.comparedTo(a.detectionConfidence.value))
      .slice(0, MAX_TOP_CONTRIBUTORS);
  }

  private toContributingProviderView(providerResult: ParticipatingProviderResult): ContributingProviderView | undefined {
    const { result } = providerResult;
    const topInterpretation = this.pickTopInterpretation(result.interpretation);
    if (!topInterpretation) return undefined;

    return {
      providerId: providerResult.providerId,
      methodologyFamily: providerResult.methodologyFamily,
      interpretationSummary: topInterpretation.summary,
      detectionConfidence: result.detectionConfidence,
      interpretationConfidence: topInterpretation.confidence,
      regimeAdjustedConfidence: topInterpretation.regimeAdjustedConfidence,
      methodologyConfidenceCeiling: result.methodologyConfidenceCeiling,
      uncertainty: result.limitations,
      traceability: result.traceability,
    };
  }

  /**
   * Never assumes `interpretation[0]` is the highest-confidence entry --
   * different Providers rank their own array by different, individually
   * disclosed conventions (e.g. recency for VSA, proximity or score for
   * others). Picks by `INTERPRETATION`-kind confidence directly instead.
   */
  private pickTopInterpretation(interpretations: readonly Interpretation[]): Interpretation | undefined {
    if (interpretations.length === 0) return undefined;
    return interpretations.reduce((best, current) => (current.confidence.value.greaterThan(best.confidence.value) ? current : best));
  }
}
