import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MacroDataService } from './macro-data.service';

@ApiTags('macro-data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('macro-data')
export class MacroDataController {
  constructor(private readonly macroDataService: MacroDataService) {}

  @Get()
  getLatestValues() {
    return this.macroDataService.getLatestValues();
  }
}
