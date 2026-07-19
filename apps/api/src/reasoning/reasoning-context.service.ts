import { Injectable } from '@nestjs/common';
import { WorkspaceService } from '../workspace/workspace.service';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MorningBriefService } from '../morning-brief/morning-brief.service';
import type { ReasoningContext } from './reasoning.types';

/**
 * Context Assembly (implementation architecture §5 stages 1-3, §6
 * "ReasoningContextService"). Every method below is a read of an
 * already-built, already-tested service -- no new Prisma query, no
 * re-derived Confluence/analytics value, mirroring `WorkspaceService`'s
 * and `ReportsService`'s own "no independent computation" discipline.
 * `WorkspaceService.getWorkspace()` already IS the exact per-instrument
 * cross-module bundle the Reasoning Layer needs (Confluence + Traceability
 * via `reading`, News, COT, Alerts, Journal) -- reused whole, not
 * decomposed and rebuilt.
 */
@Injectable()
export class ReasoningContextService {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly portfoliosService: PortfoliosService,
    private readonly analyticsService: AnalyticsService,
    private readonly morningBriefService: MorningBriefService,
  ) {}

  async buildInstrumentContext(userId: string, assetId: string): Promise<ReasoningContext> {
    const asset = await this.workspaceService.getWorkspace(userId, assetId);
    return {
      kind: 'INSTRUMENT',
      scopeDescription: `${asset.symbol} (${asset.name}) -- single instrument`,
      modulesUsed: ['Confluence Engine', 'Traceability', 'Calendar/News', 'COT', 'Alerts', 'Trading Journal'],
      generatedAt: new Date().toISOString(),
      asset,
    };
  }

  async buildPortfolioContext(userId: string, portfolioId: string): Promise<ReasoningContext> {
    const portfolio = await this.portfoliosService.findOwned(userId, portfolioId);
    const analytics = await this.analyticsService.getPortfolioAnalytics(userId, portfolioId);
    return {
      kind: 'PORTFOLIO',
      scopeDescription: `Portfolio: ${portfolio.name}`,
      modulesUsed: ['Portfolio', 'Portfolio Analytics'],
      generatedAt: new Date().toISOString(),
      portfolio: { portfolio, analytics },
    };
  }

  async buildTrackedAssetsContext(userId: string): Promise<ReasoningContext> {
    const trackedAssets = await this.morningBriefService.getMorningBrief(userId);
    return {
      kind: 'TRACKED_ASSETS',
      scopeDescription: `Tracked assets (${trackedAssets.instrumentsConsidered} instrument${trackedAssets.instrumentsConsidered === 1 ? '' : 's'} considered)`,
      modulesUsed: ['Morning Brief', 'Confluence Engine', 'Traceability'],
      generatedAt: new Date().toISOString(),
      trackedAssets,
    };
  }
}
