import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { createFavouriteAssetSchema, type CreateFavouriteAssetInput } from '@zenith/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { FavouritesService } from './favourites.service';

@ApiTags('favourites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favourites')
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  private userId(req: Request): string {
    return (req.user as AuthenticatedUser).id;
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.favouritesService.findAll(this.userId(req));
  }

  @Post()
  create(
    @Req() req: Request,
    @Body(new ZodValidationPipe(createFavouriteAssetSchema)) body: CreateFavouriteAssetInput,
  ) {
    return this.favouritesService.create(this.userId(req), body.assetId);
  }

  @Delete(':assetId')
  remove(@Req() req: Request, @Param('assetId') assetId: string) {
    return this.favouritesService.remove(this.userId(req), assetId);
  }
}
