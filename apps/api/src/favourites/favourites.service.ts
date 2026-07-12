import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { isRecordNotFoundError, isUniqueConstraintViolation } from '../common/prisma-errors';

const DUPLICATE_FAVOURITE_MESSAGE = 'This asset is already a favourite';
const NOT_FOUND_MESSAGE = 'Favourite asset not found';

@Injectable()
export class FavouritesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.favouriteAsset.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(userId: string, assetId: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    const existing = await this.prisma.favouriteAsset.findUnique({
      where: { userId_assetId: { userId, assetId } },
    });
    if (existing) {
      throw new ConflictException(DUPLICATE_FAVOURITE_MESSAGE);
    }
    try {
      return await this.prisma.favouriteAsset.create({ data: { userId, assetId } });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_FAVOURITE_MESSAGE);
      }
      throw error;
    }
  }

  async remove(userId: string, assetId: string): Promise<void> {
    const favourite = await this.prisma.favouriteAsset.findUnique({
      where: { userId_assetId: { userId, assetId } },
    });
    // A favourite that exists but belongs to another user is reported as 404,
    // not 403, to avoid confirming the existence of another user's resource.
    if (!favourite) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
    try {
      await this.prisma.favouriteAsset.delete({ where: { id: favourite.id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException(NOT_FOUND_MESSAGE);
      }
      throw error;
    }
  }
}
