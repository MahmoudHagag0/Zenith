import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { DashboardService } from './dashboard.service';

/**
 * The Dashboard API (S1-019 Sprint Brief, Scope item 5). Only
 * `GET /dashboard/decision-center` is implemented this Sprint -- the
 * concrete requirement of Scope item 3/Sprint Goal 3 (`DASH-002`).
 * Returns Dashboard-shaped DTOs only (`dashboard.types.ts`) -- never an
 * internal `ConfluenceResult`, `AnalysisProviderResult`, or Prisma entity.
 */
@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('decision-center')
  getDecisionCenter(@Req() req: Request) {
    const userId = (req.user as AuthenticatedUser).id;
    return this.dashboardService.getDecisionCenter(userId);
  }
}
