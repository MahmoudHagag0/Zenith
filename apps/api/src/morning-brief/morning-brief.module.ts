import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { MorningBriefController } from './morning-brief.controller';
import { MorningBriefService } from './morning-brief.service';
import { NarrativeComposerService } from './narrative-composer.service';

/**
 * Morning Brief Backend / Narrative Composer (S1-020 Sprint Brief, Scope
 * item 6). Imports `DashboardModule` to reuse `DashboardService.getDecisionCenter()`
 * (S1-019, unmodified) rather than duplicating its own instrument-
 * gathering/ranking orchestration -- the Confluence Engine Consumer
 * itself is never invoked directly here.
 */
@Module({
  imports: [AuthModule, DashboardModule],
  controllers: [MorningBriefController],
  providers: [MorningBriefService, NarrativeComposerService],
})
export class MorningBriefModule {}
