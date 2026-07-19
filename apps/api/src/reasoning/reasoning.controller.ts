import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { reasoningAskSchema, type ReasoningAskInput } from '@zenith/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { ReasoningService } from './reasoning.service';

@ApiTags('reasoning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reasoning')
export class ReasoningController {
  constructor(private readonly reasoningService: ReasoningService) {}

  private userId(req: Request): string {
    return (req.user as AuthenticatedUser).id;
  }

  @Post('ask')
  ask(@Req() req: Request, @Body(new ZodValidationPipe(reasoningAskSchema)) body: ReasoningAskInput) {
    return this.reasoningService.answer(this.userId(req), body.question, { assetId: body.assetId, portfolioId: body.portfolioId });
  }
}
