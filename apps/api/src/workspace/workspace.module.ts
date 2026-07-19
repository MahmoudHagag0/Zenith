import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { CalendarNewsModule } from '../calendar-news/calendar-news.module';
import { CotModule } from '../cot/cot.module';
import { AlertsModule } from '../alerts/alerts.module';
import { JournalModule } from '../journal/journal.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [AuthModule, AssetsModule, DashboardModule, CalendarNewsModule, CotModule, AlertsModule, JournalModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  // Exported so ReasoningModule can reuse getWorkspace() as its own
  // single-instrument context source rather than re-aggregating the same
  // six services itself (implementation architecture §3: "already exactly
  // the cross-module context").
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
