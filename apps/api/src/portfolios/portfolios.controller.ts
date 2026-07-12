import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  createPortfolioSchema,
  updatePortfolioSchema,
  type CreatePortfolioInput,
  type UpdatePortfolioInput,
} from '@zenith/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { PortfoliosService } from './portfolios.service';

@ApiTags('portfolios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  private userId(req: Request): string {
    return (req.user as AuthenticatedUser).id;
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.portfoliosService.findAll(this.userId(req));
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.portfoliosService.findOwned(this.userId(req), id);
  }

  @Post()
  create(
    @Req() req: Request,
    @Body(new ZodValidationPipe(createPortfolioSchema)) body: CreatePortfolioInput,
  ) {
    return this.portfoliosService.create(this.userId(req), body);
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePortfolioSchema)) body: UpdatePortfolioInput,
  ) {
    return this.portfoliosService.update(this.userId(req), id, body);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.portfoliosService.remove(this.userId(req), id);
  }
}
