import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CotService } from './cot.service';

@ApiTags('cot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cot')
export class CotController {
  constructor(private readonly cotService: CotService) {}

  @Get(':assetId')
  getReports(@Param('assetId') assetId: string) {
    return this.cotService.getReportsForAsset(assetId);
  }
}
