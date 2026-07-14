import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { MorningBriefService } from './morning-brief.service';

/**
 * Morning Brief Backend (S1-020 Sprint Brief, Scope item 5). Mirrors
 * `DashboardController`'s own exact pattern. Returns only the
 * Morning-Brief-shaped DTO (`morning-brief.types.ts`) -- never an
 * internal `DecisionCenterResponse`/`InstrumentReading` directly.
 */
@ApiTags('morning-brief')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('morning-brief')
export class MorningBriefController {
  constructor(private readonly morningBriefService: MorningBriefService) {}

  @Get()
  getMorningBrief(@Req() req: Request) {
    const userId = (req.user as AuthenticatedUser).id;
    return this.morningBriefService.getMorningBrief(userId);
  }
}
