import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from './jwt.strategy';

// No login/registration route: that requires a user store, which is out of scope for S1-001 (ADR-001).
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Get('whoami')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  whoami(@Req() req: Request): JwtPayload {
    return req.user as JwtPayload;
  }
}
