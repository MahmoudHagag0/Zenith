import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LiveDataObservabilityService } from './live-data-observability.service';

/**
 * Extended provider-health/observability surface for every live provider
 * integrated since L1-001 (L1-008, 28_LIVE_DATA_BLUEPRINT.md §9 Phase 8).
 * Additive -- the existing `GET /market-data/provider-health` endpoint
 * (single Market Data provider, L1-001) is unchanged.
 */
@ApiTags('monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly liveDataObservabilityService: LiveDataObservabilityService) {}

  @Get('provider-health')
  getProviderHealth() {
    return {
      providers: this.liveDataObservabilityService.getProviderSnapshots(),
      syncs: this.liveDataObservabilityService.getSyncSnapshots(),
    };
  }

  @Get('alerts')
  getAlerts() {
    return this.liveDataObservabilityService.getAlerts();
  }
}
