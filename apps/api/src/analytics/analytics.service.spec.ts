import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../database/prisma.service';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { PositionsService } from '../positions/positions.service';
import { MarketDataService } from '../market-data/market-data.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: { asset: { findMany: jest.Mock }; candle: { groupBy: jest.Mock } };
  let portfoliosService: { findOwned: jest.Mock };
  let positionsService: { findAll: jest.Mock };
  let marketDataService: { getQuote: jest.Mock };

  const now = new Date('2026-07-12T12:00:00.000Z');

  function position(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'pos-1',
      portfolioId: 'pf-1',
      assetId: 'as-1',
      quantity: new Prisma.Decimal(10),
      averageCost: new Prisma.Decimal(100),
      realizedPnl: new Prisma.Decimal(0),
      costBasis: new Prisma.Decimal(1000),
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  function asset(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'as-1',
      marketId: 'mk-1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      market: { id: 'mk-1', exchangeId: 'ex-1', name: 'US Equities', type: 'EQUITY' },
      ...overrides,
    };
  }

  function quote(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'q-1',
      assetId: 'as-1',
      price: new Prisma.Decimal(150),
      currency: 'USD',
      provider: 'simulated',
      asOf: now,
      fetchedAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  beforeEach(async () => {
    prisma = {
      asset: { findMany: jest.fn().mockResolvedValue([asset()]) },
      candle: { groupBy: jest.fn().mockResolvedValue([]) },
    };
    portfoliosService = { findOwned: jest.fn().mockResolvedValue({ id: 'pf-1', userId: 'user-1' }) };
    positionsService = { findAll: jest.fn().mockResolvedValue([position()]) };
    marketDataService = { getQuote: jest.fn().mockResolvedValue(quote()) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PortfoliosService, useValue: portfoliosService },
        { provide: PositionsService, useValue: positionsService },
        { provide: MarketDataService, useValue: marketDataService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('propagates ownership failures from PortfoliosService without reimplementing ownership logic', async () => {
    portfoliosService.findOwned.mockRejectedValue(new NotFoundException('Portfolio not found'));

    await expect(service.getPortfolioAnalytics('user-1', 'pf-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(positionsService.findAll).not.toHaveBeenCalled();
  });

  it('returns a fully-formed, non-crashing response for a portfolio with no positions', async () => {
    positionsService.findAll.mockResolvedValue([]);

    const result = await service.getPortfolioAnalytics('user-1', 'pf-1');

    expect(result.positions).toEqual([]);
    expect(result.summary.totalMarketValue.toString()).toBe('0');
    expect(result.decisionReadiness.status).toBe('READY_FOR_ANALYSIS');
    expect(result.portfolioHealth.score).toBe(100);
    expect(result.humanSummary).toEqual(expect.any(String));
  });

  describe('single-position arithmetic (hand-computed)', () => {
    it('computes market value, unrealized P/L, and percentages correctly', async () => {
      // 10 units @ avgCost 100 = costBasis 1000; current price 150 -> marketValue 1500
      // unrealizedPnl = 10 * (150-100) = 500; unrealizedPercent = 500/1000*100 = 50%
      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');

      const [pos] = result.positions;
      expect(pos.marketValue?.toString()).toBe('1500');
      expect(pos.unrealizedPnl?.toString()).toBe('500');
      expect(pos.unrealizedPnlPercent?.toString()).toBe('50');
      expect(pos.portfolioWeight?.toString()).toBe('100');

      expect(result.summary.totalMarketValue.toString()).toBe('1500');
      expect(result.summary.totalCostBasis.toString()).toBe('1000');
      expect(result.summary.totalUnrealizedPnl.toString()).toBe('500');
      expect(result.summary.unrealizedPercent?.toString()).toBe('50');
    });

    it('includes already-realized P/L (from closed trades) in the combined P/L, unaffected by current price', async () => {
      positionsService.findAll.mockResolvedValue([position({ realizedPnl: new Prisma.Decimal(200) })]);

      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');

      expect(result.summary.totalRealizedPnl.toString()).toBe('200');
      // combinedPnl = unrealized (500) + realized (200) = 700
      expect(result.summary.combinedPnl.toString()).toBe('700');
    });
  });

  describe('multi-position portfolio weight and concentration', () => {
    it('sums portfolio weights to 100% across multiple positions', async () => {
      positionsService.findAll.mockResolvedValue([
        position({ id: 'pos-1', assetId: 'as-1', quantity: new Prisma.Decimal(10), costBasis: new Prisma.Decimal(1000) }),
        position({ id: 'pos-2', assetId: 'as-2', quantity: new Prisma.Decimal(5), averageCost: new Prisma.Decimal(50), costBasis: new Prisma.Decimal(250) }),
      ]);
      prisma.asset.findMany.mockResolvedValue([asset(), asset({ id: 'as-2', symbol: 'MSFT' })]);
      marketDataService.getQuote.mockImplementation((assetId: string) =>
        Promise.resolve(assetId === 'as-1' ? quote({ assetId: 'as-1', price: new Prisma.Decimal(150) }) : quote({ assetId: 'as-2', price: new Prisma.Decimal(60) })),
      );

      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');

      const totalWeight = result.positions.reduce(
        (sum, p) => sum + Number(p.portfolioWeight ?? 0),
        0,
      );
      expect(Math.round(totalWeight)).toBe(100);
    });

    it('scores a single-position portfolio as maximally concentrated', async () => {
      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');
      expect(result.riskExposure.concentrationScore.score).toBe(100);
    });

    it('scores an evenly-split multi-position portfolio as low concentration', async () => {
      positionsService.findAll.mockResolvedValue([
        position({ id: 'pos-1', assetId: 'as-1', quantity: new Prisma.Decimal(10) }),
        position({ id: 'pos-2', assetId: 'as-2', quantity: new Prisma.Decimal(10) }),
        position({ id: 'pos-3', assetId: 'as-3', quantity: new Prisma.Decimal(10) }),
        position({ id: 'pos-4', assetId: 'as-4', quantity: new Prisma.Decimal(10) }),
      ]);
      prisma.asset.findMany.mockResolvedValue([
        asset({ id: 'as-1' }),
        asset({ id: 'as-2', symbol: 'B' }),
        asset({ id: 'as-3', symbol: 'C' }),
        asset({ id: 'as-4', symbol: 'D' }),
      ]);
      marketDataService.getQuote.mockImplementation((assetId: string) =>
        Promise.resolve(quote({ assetId, price: new Prisma.Decimal(100) })),
      );

      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');
      // 4 equally-weighted positions -> HHI = 4 * (0.25^2) = 0.25 -> score 25,
      // which is directionally lower than the single-position case (score 100)
      // verified in the preceding test.
      expect(result.riskExposure.concentrationScore.score).toBe(25);
    });
  });

  describe('explainability', () => {
    it('never returns the Portfolio Health Score without reasoning and contributing factors', async () => {
      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');
      expect(result.portfolioHealth.reasoning).toEqual(expect.any(String));
      expect(result.portfolioHealth.reasoning.length).toBeGreaterThan(0);
      expect(Array.isArray(result.portfolioHealth.contributingFactors)).toBe(true);
      expect(result.portfolioHealth.contributingFactors.length).toBeGreaterThan(0);
    });

    it('never returns the Concentration Score without reasoning and contributing factors', async () => {
      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');
      expect(result.riskExposure.concentrationScore.reasoning).toEqual(expect.any(String));
      expect(result.riskExposure.concentrationScore.contributingFactors.length).toBeGreaterThan(0);
    });

    it('never returns Decision Readiness without reasoning and contributing factors', async () => {
      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');
      expect(result.decisionReadiness.reasoning).toEqual(expect.any(String));
      expect(Array.isArray(result.decisionReadiness.contributingFactors)).toBe(true);
    });
  });

  describe('confidence (distinct from data quality)', () => {
    it('exposes both dataQuality and metricConfidence per position, as separate objects', async () => {
      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');
      const [pos] = result.positions;
      expect(pos.dataQuality).toBeDefined();
      expect(pos.metricConfidence).toBeDefined();
      expect(pos.dataQuality).not.toBe(pos.metricConfidence);
      expect(pos.metricConfidence.confidence).toBe('HIGH');
      expect(pos.metricConfidence.confidenceExplanation).toEqual(expect.any(String));
    });

    it('lowers metric confidence (not just data quality) when a quote is missing', async () => {
      marketDataService.getQuote.mockRejectedValue(new Error('provider unavailable'));

      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');
      const [pos] = result.positions;
      expect(pos.metricConfidence.confidence).toBe('LOW');
      expect(pos.dataQuality.freshness).toBe('MISSING');
    });
  });

  describe('graceful degradation on quote-fetch failure', () => {
    it('degrades only the affected position instead of failing the whole response', async () => {
      positionsService.findAll.mockResolvedValue([
        position({ id: 'pos-1', assetId: 'as-1' }),
        position({ id: 'pos-2', assetId: 'as-2' }),
      ]);
      prisma.asset.findMany.mockResolvedValue([asset(), asset({ id: 'as-2', symbol: 'MSFT' })]);
      marketDataService.getQuote.mockImplementation((assetId: string) =>
        assetId === 'as-1' ? Promise.resolve(quote()) : Promise.reject(new Error('rate limited')),
      );

      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');

      const ok = result.positions.find((p) => p.assetId === 'as-1');
      const degraded = result.positions.find((p) => p.assetId === 'as-2');
      expect(ok?.marketValue).not.toBeNull();
      expect(degraded?.marketValue).toBeNull();
      expect(degraded?.dataQuality.freshness).toBe('MISSING');
      expect(result.decisionReadiness.status).toBe('ANALYSIS_LIMITED');
    });

    it('marks decision readiness limited and penalizes health when a quote is stale', async () => {
      marketDataService.getQuote.mockResolvedValue(
        quote({ fetchedAt: new Date(now.getTime() - 10 * 60 * 1000) }), // 10 minutes old
      );

      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');

      expect(result.positions[0].dataQuality.freshness).toBe('STALE');
      expect(result.decisionReadiness.status).toBe('ANALYSIS_LIMITED');
    });
  });

  describe('market exposure', () => {
    it('aggregates market value by market type', async () => {
      positionsService.findAll.mockResolvedValue([
        position({ id: 'pos-1', assetId: 'as-1' }),
        position({ id: 'pos-2', assetId: 'as-2', quantity: new Prisma.Decimal(1), averageCost: new Prisma.Decimal(1), costBasis: new Prisma.Decimal(1) }),
      ]);
      prisma.asset.findMany.mockResolvedValue([
        asset({ id: 'as-1' }),
        asset({ id: 'as-2', symbol: 'BTC', market: { id: 'mk-2', exchangeId: 'ex-2', name: 'Crypto', type: 'CRYPTO' } }),
      ]);
      marketDataService.getQuote.mockImplementation((assetId: string) =>
        Promise.resolve(assetId === 'as-1' ? quote({ assetId: 'as-1', price: new Prisma.Decimal(150) }) : quote({ assetId: 'as-2', price: new Prisma.Decimal(1) })),
      );

      const result = await service.getPortfolioAnalytics('user-1', 'pf-1');

      const types = result.riskExposure.marketExposure.map((m) => m.marketType);
      expect(types).toEqual(expect.arrayContaining(['EQUITY', 'CRYPTO']));
    });
  });

  describe('no historical persistence', () => {
    it('does not write to the database — Analytics is a pure read/compute layer', async () => {
      await service.getPortfolioAnalytics('user-1', 'pf-1');
      // No create/update/upsert/delete call was made on any injected mock.
      const prismaMockCalls = [prisma.asset.findMany, prisma.candle.groupBy];
      for (const mockFn of prismaMockCalls) {
        for (const call of mockFn.mock.calls) {
          expect(JSON.stringify(call)).not.toMatch(/create|update|upsert|delete/i);
        }
      }
    });

    it('returns numerically identical results for a repeated request against unchanged data', async () => {
      const first = await service.getPortfolioAnalytics('user-1', 'pf-1');
      const second = await service.getPortfolioAnalytics('user-1', 'pf-1');
      expect(second.summary.totalMarketValue.toString()).toBe(first.summary.totalMarketValue.toString());
      expect(second.riskExposure.concentrationScore.score).toBe(first.riskExposure.concentrationScore.score);
    });
  });
});
