import { Test, TestingModule } from '@nestjs/testing';
import { ReasoningContextService } from './reasoning-context.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MorningBriefService } from '../morning-brief/morning-brief.service';

describe('ReasoningContextService', () => {
  let service: ReasoningContextService;
  let workspaceService: { getWorkspace: jest.Mock };
  let portfoliosService: { findOwned: jest.Mock };
  let analyticsService: { getPortfolioAnalytics: jest.Mock };
  let morningBriefService: { getMorningBrief: jest.Mock };

  beforeEach(async () => {
    workspaceService = { getWorkspace: jest.fn().mockResolvedValue({ assetId: 'asset-1', symbol: 'EURUSD', name: 'Euro / US Dollar' }) };
    portfoliosService = { findOwned: jest.fn().mockResolvedValue({ id: 'portfolio-1', name: 'Main' }) };
    analyticsService = { getPortfolioAnalytics: jest.fn().mockResolvedValue({ portfolioId: 'portfolio-1' }) };
    morningBriefService = { getMorningBrief: jest.fn().mockResolvedValue({ readiness: 'OPPORTUNITIES_AVAILABLE', instrumentsConsidered: 3, entries: [] }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReasoningContextService,
        { provide: WorkspaceService, useValue: workspaceService },
        { provide: PortfoliosService, useValue: portfoliosService },
        { provide: AnalyticsService, useValue: analyticsService },
        { provide: MorningBriefService, useValue: morningBriefService },
      ],
    }).compile();

    service = module.get<ReasoningContextService>(ReasoningContextService);
  });

  it('buildInstrumentContext reuses WorkspaceService.getWorkspace() as-is', async () => {
    const context = await service.buildInstrumentContext('user-1', 'asset-1');

    expect(workspaceService.getWorkspace).toHaveBeenCalledWith('user-1', 'asset-1');
    expect(context.kind).toBe('INSTRUMENT');
    if (context.kind === 'INSTRUMENT') {
      expect(context.asset.symbol).toBe('EURUSD');
    }
  });

  it('buildPortfolioContext reuses PortfoliosService.findOwned() and AnalyticsService.getPortfolioAnalytics()', async () => {
    const context = await service.buildPortfolioContext('user-1', 'portfolio-1');

    expect(portfoliosService.findOwned).toHaveBeenCalledWith('user-1', 'portfolio-1');
    expect(analyticsService.getPortfolioAnalytics).toHaveBeenCalledWith('user-1', 'portfolio-1');
    expect(context.kind).toBe('PORTFOLIO');
    if (context.kind === 'PORTFOLIO') {
      expect(context.portfolio.portfolio.name).toBe('Main');
    }
  });

  it('buildTrackedAssetsContext reuses MorningBriefService.getMorningBrief() as-is', async () => {
    const context = await service.buildTrackedAssetsContext('user-1');

    expect(morningBriefService.getMorningBrief).toHaveBeenCalledWith('user-1');
    expect(context.kind).toBe('TRACKED_ASSETS');
    expect(context.scopeDescription).toContain('3 instruments');
  });
});
