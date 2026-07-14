import { Injectable } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';
import { NarrativeComposerService } from './narrative-composer.service';
import type { MorningBriefResponse } from './morning-brief.types';

/**
 * Morning Brief orchestration (S1-020 Sprint Brief, Scope item 4).
 * Performs NO independent instrument-gathering, ranking, or Confluence
 * aggregation of its own -- it calls `DashboardService.getDecisionCenter()`
 * (S1-019, unmodified) exactly once and passes its exact result to the
 * Narrative Composer. This is the Sprint's own required 100% reuse of
 * S1-019's orchestration; duplicating any of that logic here would be
 * exactly the "duplicated business logic" the Sprint Brief forbids.
 */
@Injectable()
export class MorningBriefService {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly narrativeComposerService: NarrativeComposerService,
  ) {}

  async getMorningBrief(userId: string): Promise<MorningBriefResponse> {
    const decisionCenter = await this.dashboardService.getDecisionCenter(userId);
    return this.narrativeComposerService.compose(decisionCenter);
  }
}
