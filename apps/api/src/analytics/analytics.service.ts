import { Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import { PrismaService } from '../database/prisma.service';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { PositionsService } from '../positions/positions.service';
import { MarketDataService } from '../market-data/market-data.service';

type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
type Freshness = 'FRESH' | 'STALE' | 'MISSING';
type ReadinessStatus = 'READY_FOR_ANALYSIS' | 'ANALYSIS_LIMITED';

// Rule-based thresholds for this sprint's scoring/readiness logic (Scope items
// 3-5). Not architectural decisions — calibration of an already-approved
// rule-based scoring approach (see Sprint Brief Missing Decisions; an
// implementation-time Decision Log entry is anticipated to record these).
const STALE_QUOTE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const CONCENTRATED_MARKET_TYPE_THRESHOLD_PERCENT = 75;
const MIN_DIVERSIFIED_POSITION_COUNT = 3;

const ZERO = new Prisma.Decimal(0);
const HUNDRED = new Prisma.Decimal(100);

interface DataQuality {
  quoteAgeSeconds: number | null;
  lastUpdated: string | null;
  freshness: Freshness;
  confidence: ConfidenceLevel;
  dataStatus: string;
}

interface MetricConfidence {
  confidence: ConfidenceLevel;
  confidenceExplanation: string;
}

interface ScoreResult {
  score: number;
  reasoning: string;
  contributingFactors: string[];
}

interface ReadinessResult {
  status: ReadinessStatus;
  reasoning: string;
  contributingFactors: string[];
}

interface AllocationEntry {
  assetId: string;
  symbol: string;
  marketValue: Prisma.Decimal;
  weightPercent: Prisma.Decimal;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portfoliosService: PortfoliosService,
    private readonly positionsService: PositionsService,
    private readonly marketDataService: MarketDataService,
  ) {}

  async getPortfolioAnalytics(userId: string, portfolioId: string) {
    await this.portfoliosService.findOwned(userId, portfolioId);
    const positions = await this.positionsService.findAll(userId, portfolioId);

    if (positions.length === 0) {
      return this.buildEmptyAnalytics(portfolioId);
    }

    const assetIds = positions.map((position) => position.assetId);
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds } },
      include: { market: true },
    });
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));

    const candleCounts = await this.prisma.candle.groupBy({
      by: ['assetId'],
      where: { assetId: { in: assetIds } },
      _count: { _all: true },
    });
    const assetsWithCandles = new Set(candleCounts.map((row) => row.assetId));

    const now = Date.now();

    // First pass: resolve a quote (or gracefully degrade) for every position
    // and compute the metrics that do not depend on the portfolio total.
    const enriched = await Promise.all(
      positions.map(async (position) => {
        const asset = assetById.get(position.assetId);
        const quote = await this.tryGetQuote(position.assetId);
        const dataQuality = this.buildDataQuality(quote, now);

        const marketValue = quote ? position.quantity.times(quote.price) : null;
        const unrealizedPnl = quote ? position.quantity.times(quote.price.minus(position.averageCost)) : null;
        const unrealizedPnlPercent =
          unrealizedPnl && position.costBasis.greaterThan(ZERO)
            ? unrealizedPnl.div(position.costBasis).times(HUNDRED)
            : null;

        return {
          position,
          asset,
          quote,
          marketValue,
          unrealizedPnl,
          unrealizedPnlPercent,
          dataQuality,
          hasCandles: assetsWithCandles.has(position.assetId),
        };
      }),
    );

    const totalMarketValue = enriched.reduce(
      (sum, e) => (e.marketValue ? sum.plus(e.marketValue) : sum),
      ZERO,
    );
    const totalCostBasis = positions.reduce((sum, p) => sum.plus(p.costBasis), ZERO);
    const totalUnrealizedPnl = enriched.reduce(
      (sum, e) => (e.unrealizedPnl ? sum.plus(e.unrealizedPnl) : sum),
      ZERO,
    );
    const totalRealizedPnl = positions.reduce((sum, p) => sum.plus(p.realizedPnl), ZERO);
    const combinedPnl = totalUnrealizedPnl.plus(totalRealizedPnl);
    const unrealizedPercent = totalCostBasis.greaterThan(ZERO)
      ? totalUnrealizedPnl.div(totalCostBasis).times(HUNDRED)
      : null;
    const realizedPercent = totalCostBasis.greaterThan(ZERO)
      ? totalRealizedPnl.div(totalCostBasis).times(HUNDRED)
      : null;

    // Second pass: portfolio weight depends on the now-known total.
    const positionResults = enriched.map((e) => {
      const weightPercent =
        e.marketValue && totalMarketValue.greaterThan(ZERO)
          ? e.marketValue.div(totalMarketValue).times(HUNDRED)
          : null;
      return {
        positionId: e.position.id,
        assetId: e.position.assetId,
        symbol: e.asset?.symbol ?? 'UNKNOWN',
        name: e.asset?.name ?? 'Unknown asset',
        quantity: e.position.quantity,
        averageCost: e.position.averageCost,
        costBasis: e.position.costBasis,
        realizedPnl: e.position.realizedPnl,
        currentPrice: e.quote?.price ?? null,
        marketValue: e.marketValue,
        unrealizedPnl: e.unrealizedPnl,
        unrealizedPnlPercent: e.unrealizedPnlPercent,
        portfolioWeight: weightPercent,
        dataQuality: e.dataQuality,
        metricConfidence: this.buildMetricConfidence(e.dataQuality, e.quote !== null),
      };
    });

    const allocations: AllocationEntry[] = enriched
      .filter((e) => e.marketValue !== null && totalMarketValue.greaterThan(ZERO))
      .map((e) => ({
        assetId: e.position.assetId,
        symbol: e.asset?.symbol ?? 'UNKNOWN',
        marketValue: e.marketValue as Prisma.Decimal,
        weightPercent: (e.marketValue as Prisma.Decimal).div(totalMarketValue).times(HUNDRED),
      }))
      .sort((a, b) => b.weightPercent.comparedTo(a.weightPercent));

    const marketExposure = this.buildMarketExposure(enriched, totalMarketValue);
    const largestPosition = allocations[0] ?? null;
    const concentrationScore = this.buildConcentrationScore(allocations);

    const missingQuoteAssets = enriched.filter((e) => e.quote === null).map((e) => e.asset?.symbol ?? e.position.assetId);
    const staleQuoteAssets = enriched
      .filter((e) => e.dataQuality.freshness === 'STALE')
      .map((e) => e.asset?.symbol ?? e.position.assetId);
    const missingCandleAssets = enriched
      .filter((e) => !e.hasCandles)
      .map((e) => e.asset?.symbol ?? e.position.assetId);

    const portfolioHealth = this.buildPortfolioHealth({
      concentrationScore,
      positionCount: positions.length,
      missingQuoteCount: missingQuoteAssets.length,
      marketExposure,
    });

    const decisionReadiness = this.buildDecisionReadiness({
      missingQuoteAssets,
      staleQuoteAssets,
      missingCandleAssets,
    });

    const aggregateDataQuality = this.buildAggregateDataQuality(enriched.map((e) => e.dataQuality));
    const aggregateConfidence = this.buildAggregateConfidence(positionResults.map((p) => p.metricConfidence));

    const humanSummary = this.buildHumanSummary({
      totalUnrealizedPnl,
      unrealizedPercent,
      portfolioHealth,
      decisionReadiness,
    });

    return {
      portfolioId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalMarketValue,
        totalCostBasis,
        totalUnrealizedPnl,
        totalRealizedPnl,
        combinedPnl,
        unrealizedPercent,
        realizedPercent,
      },
      positions: positionResults,
      riskExposure: {
        largestPosition: largestPosition
          ? {
              assetId: largestPosition.assetId,
              symbol: largestPosition.symbol,
              marketValue: largestPosition.marketValue,
              weightPercent: largestPosition.weightPercent,
            }
          : null,
        // A portfolio holds at most one open Position per Asset (S1-004's
        // Portfolio/Position schema enforces this via a unique constraint),
        // so "largest position" and "largest single-asset allocation" are
        // currently always the same entity. Both are exposed, per the
        // approved Scope, for API clarity and forward-compatibility should a
        // future sprint ever allow multiple lots per asset.
        largestAssetAllocation: largestPosition
          ? {
              assetId: largestPosition.assetId,
              symbol: largestPosition.symbol,
              weightPercent: largestPosition.weightPercent,
            }
          : null,
        marketExposure,
        assetAllocation: allocations.map((a) => ({
          assetId: a.assetId,
          symbol: a.symbol,
          marketValue: a.marketValue,
          weightPercent: a.weightPercent,
        })),
        concentrationScore,
      },
      portfolioHealth,
      decisionReadiness,
      dataQuality: aggregateDataQuality,
      metricConfidence: aggregateConfidence,
      humanSummary,
    };
  }

  private async tryGetQuote(assetId: string) {
    try {
      return await this.marketDataService.getQuote(assetId);
    } catch {
      // Graceful degradation: a single provider failure (rate-limited,
      // unavailable, etc.) must not fail the whole analytics response — the
      // affected position is reported with missing data instead.
      return null;
    }
  }

  private buildDataQuality(
    quote: { price: Prisma.Decimal; asOf: Date; fetchedAt: Date } | null,
    now: number,
  ): DataQuality {
    if (!quote) {
      return {
        quoteAgeSeconds: null,
        lastUpdated: null,
        freshness: 'MISSING',
        confidence: 'LOW',
        dataStatus: 'No quote available for this asset',
      };
    }
    const ageMs = now - quote.fetchedAt.getTime();
    const freshness: Freshness = ageMs > STALE_QUOTE_THRESHOLD_MS ? 'STALE' : 'FRESH';
    const confidence: ConfidenceLevel = freshness === 'FRESH' ? 'HIGH' : 'MEDIUM';
    const ageSeconds = Math.round(ageMs / 1000);
    return {
      quoteAgeSeconds: ageSeconds,
      lastUpdated: quote.asOf.toISOString(),
      freshness,
      confidence,
      dataStatus:
        freshness === 'FRESH'
          ? `Fresh quote (${ageSeconds}s old)`
          : `Stale quote (${Math.round(ageMs / 60_000)}m old)`,
    };
  }

  private buildMetricConfidence(dataQuality: DataQuality, hasQuote: boolean): MetricConfidence {
    if (!hasQuote) {
      return {
        confidence: 'LOW',
        confidenceExplanation:
          'Market value and unrealized P/L cannot be computed — no quote is available for this asset.',
      };
    }
    if (dataQuality.freshness === 'STALE') {
      return {
        confidence: 'MEDIUM',
        confidenceExplanation: `This position's computed metrics are based on a quote that is ${dataQuality.dataStatus.toLowerCase()}.`,
      };
    }
    return {
      confidence: 'HIGH',
      confidenceExplanation: `This position's computed metrics are based on a fresh quote (${dataQuality.dataStatus.toLowerCase()}).`,
    };
  }

  private buildMarketExposure(
    enriched: Array<{
      position: { assetId: string };
      asset?: { market?: { type: string } | null } | null;
      marketValue: Prisma.Decimal | null;
    }>,
    totalMarketValue: Prisma.Decimal,
  ) {
    const byType = new Map<string, Prisma.Decimal>();
    for (const e of enriched) {
      if (!e.marketValue) continue;
      const type = e.asset?.market?.type ?? 'UNKNOWN';
      byType.set(type, (byType.get(type) ?? ZERO).plus(e.marketValue));
    }
    return Array.from(byType.entries())
      .map(([marketType, value]) => ({
        marketType,
        marketValue: value,
        weightPercent: totalMarketValue.greaterThan(ZERO) ? value.div(totalMarketValue).times(HUNDRED) : ZERO,
      }))
      .sort((a, b) => b.weightPercent.comparedTo(a.weightPercent));
  }

  private buildConcentrationScore(allocations: AllocationEntry[]): ScoreResult {
    if (allocations.length === 0) {
      return {
        score: 0,
        reasoning: 'No priced positions to evaluate concentration.',
        contributingFactors: ['No positions with an available market value.'],
      };
    }
    // Herfindahl-Hirschman-style index: sum of squared weight fractions,
    // scaled to 0-100. A single position at 100% weight scores 100
    // (maximally concentrated); many equally-weighted positions score low.
    const hhi = allocations.reduce((sum, a) => {
      const fraction = a.weightPercent.div(HUNDRED);
      return sum.plus(fraction.times(fraction));
    }, ZERO);
    const score = Math.round(hhi.times(HUNDRED).toNumber());
    const largest = allocations[0];
    const contributingFactors = [
      `${largest.symbol} represents ${largest.weightPercent.toFixed(1)}% of holdings.`,
      `Portfolio is split across ${allocations.length} priced position(s).`,
    ];
    const reasoning =
      score >= 60
        ? `Portfolio is concentrated: ${largest.symbol} dominates at ${largest.weightPercent.toFixed(1)}% of holdings.`
        : score >= 30
          ? 'Portfolio has moderate concentration.'
          : 'Portfolio is well diversified across its priced positions.';
    return { score, reasoning, contributingFactors };
  }

  private buildPortfolioHealth(input: {
    concentrationScore: ScoreResult;
    positionCount: number;
    missingQuoteCount: number;
    marketExposure: Array<{ marketType: string; weightPercent: Prisma.Decimal }>;
  }): ScoreResult {
    const factors: string[] = [];
    let penalty = 0;

    const concentrationPenalty = input.concentrationScore.score * 0.3;
    penalty += concentrationPenalty;
    factors.push(
      concentrationPenalty > 10
        ? `- High position concentration (concentration score ${input.concentrationScore.score}/100).`
        : `+ Position concentration is within a healthy range.`,
    );

    const balancePenalty = input.positionCount < MIN_DIVERSIFIED_POSITION_COUNT ? 15 : 0;
    penalty += balancePenalty;
    factors.push(
      balancePenalty > 0
        ? `- Only ${input.positionCount} position(s) held; limited diversification.`
        : `+ Diversified across ${input.positionCount} positions.`,
    );

    const missingDataPenalty = Math.min(30, input.missingQuoteCount * 10);
    penalty += missingDataPenalty;
    factors.push(
      missingDataPenalty > 0
        ? `- Missing market data for ${input.missingQuoteCount} position(s).`
        : `+ Market data is available for every position.`,
    );

    const dominantExposure = input.marketExposure[0];
    const exposurePenalty =
      dominantExposure && dominantExposure.weightPercent.greaterThan(CONCENTRATED_MARKET_TYPE_THRESHOLD_PERCENT)
        ? 20
        : 0;
    penalty += exposurePenalty;
    factors.push(
      exposurePenalty > 0 && dominantExposure
        ? `- Excessive exposure to a single market type (${dominantExposure.marketType} at ${dominantExposure.weightPercent.toFixed(1)}%).`
        : `+ No single market type dominates the portfolio.`,
    );

    const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
    const reasoning =
      score >= 80
        ? `Portfolio Health is good (${score}/100).`
        : score >= 50
          ? `Portfolio Health is fair (${score}/100) — see contributing factors.`
          : `Portfolio Health is poor (${score}/100) — see contributing factors.`;

    return { score, reasoning, contributingFactors: factors };
  }

  private buildDecisionReadiness(input: {
    missingQuoteAssets: string[];
    staleQuoteAssets: string[];
    missingCandleAssets: string[];
  }): ReadinessResult {
    const factors: string[] = [];
    if (input.missingQuoteAssets.length > 0) {
      factors.push(`Missing quotes for: ${input.missingQuoteAssets.join(', ')}.`);
    }
    if (input.staleQuoteAssets.length > 0) {
      factors.push(`Stale quotes for: ${input.staleQuoteAssets.join(', ')}.`);
    }
    if (input.missingCandleAssets.length > 0) {
      // Informational only — this sprint exposes no candle-derived metric,
      // so missing candles do not by themselves limit readiness, but are
      // surfaced for transparency ahead of future day-change consumers.
      factors.push(`No historical candle data cached yet for: ${input.missingCandleAssets.join(', ')}.`);
    }

    const blocking = input.missingQuoteAssets.length > 0 || input.staleQuoteAssets.length > 0;
    if (!blocking) {
      return {
        status: 'READY_FOR_ANALYSIS',
        reasoning: 'All positions have fresh, complete market data.',
        contributingFactors: factors.length > 0 ? factors : ['All quotes are fresh and complete.'],
      };
    }
    return {
      status: 'ANALYSIS_LIMITED',
      reasoning: 'Some analytics are based on missing or stale market data — treat totals as approximate.',
      contributingFactors: factors,
    };
  }

  private buildAggregateDataQuality(items: DataQuality[]): DataQuality {
    if (items.length === 0) {
      return {
        quoteAgeSeconds: null,
        lastUpdated: null,
        freshness: 'MISSING',
        confidence: 'LOW',
        dataStatus: 'No positions to evaluate.',
      };
    }
    const anyMissing = items.some((i) => i.freshness === 'MISSING');
    const anyStale = items.some((i) => i.freshness === 'STALE');
    const freshness: Freshness = anyMissing ? 'MISSING' : anyStale ? 'STALE' : 'FRESH';
    const confidence: ConfidenceLevel = anyMissing ? 'LOW' : anyStale ? 'MEDIUM' : 'HIGH';
    const ages = items.map((i) => i.quoteAgeSeconds).filter((age): age is number => age !== null);
    const oldest = ages.length > 0 ? Math.max(...ages) : null;
    const missingCount = items.filter((i) => i.freshness === 'MISSING').length;
    const staleCount = items.filter((i) => i.freshness === 'STALE').length;
    return {
      quoteAgeSeconds: oldest,
      lastUpdated: null,
      freshness,
      confidence,
      dataStatus:
        missingCount === 0 && staleCount === 0
          ? 'All position quotes are fresh.'
          : `${missingCount} position(s) missing a quote, ${staleCount} position(s) stale.`,
    };
  }

  private buildAggregateConfidence(items: MetricConfidence[]): MetricConfidence {
    if (items.length === 0) {
      return { confidence: 'LOW', confidenceExplanation: 'No positions to evaluate.' };
    }
    const anyLow = items.some((i) => i.confidence === 'LOW');
    const anyMedium = items.some((i) => i.confidence === 'MEDIUM');
    const confidence: ConfidenceLevel = anyLow ? 'LOW' : anyMedium ? 'MEDIUM' : 'HIGH';
    const degraded = items.filter((i) => i.confidence !== 'HIGH').length;
    return {
      confidence,
      confidenceExplanation:
        degraded === 0
          ? 'All position-level metrics are based on fresh, complete data.'
          : `${degraded} of ${items.length} position(s) have degraded confidence — see per-position detail.`,
    };
  }

  private buildHumanSummary(input: {
    totalUnrealizedPnl: Prisma.Decimal;
    unrealizedPercent: Prisma.Decimal | null;
    portfolioHealth: ScoreResult;
    decisionReadiness: ReadinessResult;
  }): string {
    const direction = input.totalUnrealizedPnl.greaterThanOrEqualTo(ZERO) ? 'up' : 'down';
    const magnitude = input.totalUnrealizedPnl.abs().toFixed(2);
    const percent = input.unrealizedPercent ? ` (${input.unrealizedPercent.abs().toFixed(1)}%)` : '';
    const readiness =
      input.decisionReadiness.status === 'READY_FOR_ANALYSIS'
        ? 'Analytics are ready for decision-making.'
        : 'Analytics are limited by incomplete market data — treat totals as approximate.';
    return `Portfolio is ${direction} $${magnitude}${percent} unrealized. Portfolio Health: ${input.portfolioHealth.score}/100. ${readiness}`;
  }

  private buildEmptyAnalytics(portfolioId: string) {
    const emptyReadiness: ReadinessResult = {
      status: 'READY_FOR_ANALYSIS',
      reasoning: 'No positions are held, so there is no market data to be limited by.',
      contributingFactors: ['Portfolio holds no positions.'],
    };
    const emptyHealth: ScoreResult = {
      score: 100,
      reasoning: 'No positions held — no risk factors to evaluate.',
      contributingFactors: ['+ Portfolio holds no positions, so no concentration or exposure risk exists.'],
    };
    const emptyDataQuality: DataQuality = {
      quoteAgeSeconds: null,
      lastUpdated: null,
      freshness: 'MISSING',
      confidence: 'HIGH',
      dataStatus: 'No positions to evaluate.',
    };
    const emptyConfidence: MetricConfidence = {
      confidence: 'HIGH',
      confidenceExplanation: 'No positions held, so there is nothing to compute.',
    };
    return {
      portfolioId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalMarketValue: ZERO,
        totalCostBasis: ZERO,
        totalUnrealizedPnl: ZERO,
        totalRealizedPnl: ZERO,
        combinedPnl: ZERO,
        unrealizedPercent: null,
        realizedPercent: null,
      },
      positions: [],
      riskExposure: {
        largestPosition: null,
        largestAssetAllocation: null,
        marketExposure: [],
        assetAllocation: [],
        concentrationScore: {
          score: 0,
          reasoning: 'No positions to evaluate concentration.',
          contributingFactors: ['Portfolio holds no positions.'],
        },
      },
      portfolioHealth: emptyHealth,
      decisionReadiness: emptyReadiness,
      dataQuality: emptyDataQuality,
      metricConfidence: emptyConfidence,
      humanSummary: 'Portfolio holds no positions yet — nothing to analyze.',
    };
  }
}
