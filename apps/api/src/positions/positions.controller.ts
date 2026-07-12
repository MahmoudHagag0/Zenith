import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { buySchema, sellSchema, type BuyInput, type SellInput } from '@zenith/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { PositionsService } from './positions.service';

@ApiTags('positions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portfolios/:portfolioId/positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  private userId(req: Request): string {
    return (req.user as AuthenticatedUser).id;
  }

  @Get()
  findAll(@Req() req: Request, @Param('portfolioId') portfolioId: string) {
    return this.positionsService.findAll(this.userId(req), portfolioId);
  }

  @Get(':positionId')
  findOne(
    @Req() req: Request,
    @Param('portfolioId') portfolioId: string,
    @Param('positionId') positionId: string,
  ) {
    return this.positionsService.findOne(this.userId(req), portfolioId, positionId);
  }

  @Get(':positionId/transactions')
  listTransactions(
    @Req() req: Request,
    @Param('portfolioId') portfolioId: string,
    @Param('positionId') positionId: string,
  ) {
    return this.positionsService.listTransactions(this.userId(req), portfolioId, positionId);
  }

  @Post('buy')
  buy(
    @Req() req: Request,
    @Param('portfolioId') portfolioId: string,
    @Body(new ZodValidationPipe(buySchema)) body: BuyInput,
  ) {
    return this.positionsService.buy(this.userId(req), portfolioId, body);
  }

  @Post('sell')
  sell(
    @Req() req: Request,
    @Param('portfolioId') portfolioId: string,
    @Body(new ZodValidationPipe(sellSchema)) body: SellInput,
  ) {
    return this.positionsService.sell(this.userId(req), portfolioId, body);
  }

  @Delete(':positionId')
  remove(
    @Req() req: Request,
    @Param('portfolioId') portfolioId: string,
    @Param('positionId') positionId: string,
  ) {
    return this.positionsService.remove(this.userId(req), portfolioId, positionId);
  }
}
