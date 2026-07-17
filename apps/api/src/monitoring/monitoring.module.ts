import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MonitoringController } from './monitoring.controller';
import { LiveDataObservabilityService } from './live-data-observability.service';

/**
 * Owns `LiveDataObservabilityService` (L1-008). Every Live Data domain
 * module (market-data, calendar-news, cot, corporate-actions, macro-data)
 * imports this module to inject the service into its own providers/sync
 * services -- a one-directional dependency identical in shape to
 * `WorkspaceModule` importing multiple existing domain modules (S1-033),
 * just inverted: here, domain modules depend on `MonitoringModule`,
 * `MonitoringModule` depends on none of them. No circular import risk.
 */
@Module({
  imports: [AuthModule],
  controllers: [MonitoringController],
  providers: [LiveDataObservabilityService],
  exports: [LiveDataObservabilityService],
})
export class MonitoringModule {}
