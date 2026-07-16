import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { CalendarNewsService } from './calendar-news.service';

@ApiTags('calendar-news')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calendar-news')
export class CalendarNewsController {
  constructor(private readonly calendarNewsService: CalendarNewsService) {}

  private userId(req: Request): string {
    return (req.user as AuthenticatedUser).id;
  }

  @Get('news')
  getNews(@Req() req: Request, @Query('assetId') assetId?: string) {
    if (assetId) return this.calendarNewsService.getNewsForAsset(assetId);
    return this.calendarNewsService.getNewsForTrackedAssets(this.userId(req));
  }

  @Get('events')
  getEvents(@Req() req: Request, @Query('assetId') assetId?: string) {
    if (assetId) return this.calendarNewsService.getUpcomingEventsForAsset(assetId);
    return this.calendarNewsService.getUpcomingEventsForTrackedAssets(this.userId(req));
  }
}
