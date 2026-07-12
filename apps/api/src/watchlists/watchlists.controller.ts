import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  addWatchlistItemSchema,
  createWatchlistSchema,
  updateWatchlistSchema,
  type AddWatchlistItemInput,
  type CreateWatchlistInput,
  type UpdateWatchlistInput,
} from '@zenith/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { WatchlistsService } from './watchlists.service';

@ApiTags('watchlists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('watchlists')
export class WatchlistsController {
  constructor(private readonly watchlistsService: WatchlistsService) {}

  private userId(req: Request): string {
    return (req.user as AuthenticatedUser).id;
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.watchlistsService.findAll(this.userId(req));
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.watchlistsService.findOne(this.userId(req), id);
  }

  @Post()
  create(@Req() req: Request, @Body(new ZodValidationPipe(createWatchlistSchema)) body: CreateWatchlistInput) {
    return this.watchlistsService.create(this.userId(req), body);
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateWatchlistSchema)) body: UpdateWatchlistInput,
  ) {
    return this.watchlistsService.update(this.userId(req), id, body);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.watchlistsService.remove(this.userId(req), id);
  }

  @Get(':id/items')
  listItems(@Req() req: Request, @Param('id') id: string) {
    return this.watchlistsService.listItems(this.userId(req), id);
  }

  @Post(':id/items')
  addItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addWatchlistItemSchema)) body: AddWatchlistItemInput,
  ) {
    return this.watchlistsService.addItem(this.userId(req), id, body.assetId);
  }

  @Delete(':id/items/:assetId')
  removeItem(@Req() req: Request, @Param('id') id: string, @Param('assetId') assetId: string) {
    return this.watchlistsService.removeItem(this.userId(req), id, assetId);
  }
}
