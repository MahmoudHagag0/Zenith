import { Injectable } from '@nestjs/common';
import type { DecisionCenterResponse } from '../dashboard/dashboard.types';
import { composeMorningBrief } from './narrative-composer.util';
import type { MorningBriefResponse } from './morning-brief.types';

/**
 * Thin injectable wrapper around the pure `composeMorningBrief()` function
 * (S1-020 Sprint Brief, Scope item 3) -- mirroring `DashboardService`'s own
 * use of `net-direction-ranking.util.ts`. Contains no logic of its own
 * beyond delegation, so the deterministic template logic remains
 * independently unit-testable without any NestJS DI machinery.
 */
@Injectable()
export class NarrativeComposerService {
  compose(decisionCenter: DecisionCenterResponse): MorningBriefResponse {
    return composeMorningBrief(decisionCenter);
  }
}
