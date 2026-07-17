import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CorporateActionsService } from './corporate-actions.service';

@ApiTags('corporate-actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('corporate-actions')
export class CorporateActionsController {
  constructor(private readonly corporateActionsService: CorporateActionsService) {}

  @Get(':assetId')
  getActions(@Param('assetId') assetId: string) {
    return this.corporateActionsService.getActionsForAsset(assetId);
  }
}
