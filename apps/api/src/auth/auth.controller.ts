import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@zenith/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedUser } from './jwt.strategy';

// Brute-force/credential-stuffing hardening (Foundation Acceptance Review,
// High #1): at most 5 attempts per minute per IP on the two credential
// endpoints. No other route is throttled.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterInput): Promise<{ accessToken: string }> {
    const accessToken = await this.authService.register(body.email, body.password);
    return { accessToken };
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginInput): Promise<{ accessToken: string }> {
    const accessToken = await this.authService.login(body.email, body.password);
    return { accessToken };
  }

  @Get('whoami')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  whoami(@Req() req: Request): AuthenticatedUser {
    return req.user as AuthenticatedUser;
  }
}
