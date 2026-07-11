import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { checkDatabaseConnection } from '@zenith/database';
import { healthResponseSchema, type HealthResponse } from '@zenith/validation';
import { PrismaService } from '../database/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'Service and database health status.' })
  async check(): Promise<HealthResponse> {
    await checkDatabaseConnection(this.prisma);
    return healthResponseSchema.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
}
