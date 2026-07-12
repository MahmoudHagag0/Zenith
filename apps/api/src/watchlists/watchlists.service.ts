import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateWatchlistInput, UpdateWatchlistInput } from '@zenith/validation';
import { PrismaService } from '../database/prisma.service';
import { isRecordNotFoundError, isUniqueConstraintViolation } from '../common/prisma-errors';

const DUPLICATE_NAME_MESSAGE = 'A watchlist with this name already exists';
const NOT_FOUND_MESSAGE = 'Watchlist not found';
const DUPLICATE_ITEM_MESSAGE = 'This asset is already on the watchlist';

@Injectable()
export class WatchlistsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.watchlist.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  }

  async findOne(userId: string, id: string) {
    const watchlist = await this.prisma.watchlist.findUnique({ where: { id } });
    // A watchlist that exists but belongs to another user is reported as 404,
    // not 403, to avoid confirming the existence of another user's resource ID.
    if (!watchlist || watchlist.userId !== userId) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
    return watchlist;
  }

  async create(userId: string, input: CreateWatchlistInput) {
    const existing = await this.prisma.watchlist.findUnique({
      where: { userId_name: { userId, name: input.name } },
    });
    if (existing) {
      throw new ConflictException(DUPLICATE_NAME_MESSAGE);
    }
    try {
      return await this.prisma.watchlist.create({ data: { userId, name: input.name } });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_NAME_MESSAGE);
      }
      throw error;
    }
  }

  async update(userId: string, id: string, input: UpdateWatchlistInput) {
    const watchlist = await this.findOne(userId, id);
    try {
      return await this.prisma.watchlist.update({ where: { id: watchlist.id }, data: input });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_NAME_MESSAGE);
      }
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException(NOT_FOUND_MESSAGE);
      }
      throw error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    const watchlist = await this.findOne(userId, id);
    try {
      await this.prisma.watchlist.delete({ where: { id: watchlist.id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException(NOT_FOUND_MESSAGE);
      }
      throw error;
    }
  }

  async listItems(userId: string, watchlistId: string) {
    await this.findOne(userId, watchlistId);
    return this.prisma.watchlistItem.findMany({
      where: { watchlistId },
      include: { asset: true },
      orderBy: { addedAt: 'asc' },
    });
  }

  async addItem(userId: string, watchlistId: string, assetId: string) {
    const watchlist = await this.findOne(userId, watchlistId);
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    const existing = await this.prisma.watchlistItem.findUnique({
      where: { watchlistId_assetId: { watchlistId: watchlist.id, assetId } },
    });
    if (existing) {
      throw new ConflictException(DUPLICATE_ITEM_MESSAGE);
    }
    try {
      return await this.prisma.watchlistItem.create({ data: { watchlistId: watchlist.id, assetId } });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_ITEM_MESSAGE);
      }
      throw error;
    }
  }

  async removeItem(userId: string, watchlistId: string, assetId: string): Promise<void> {
    const watchlist = await this.findOne(userId, watchlistId);
    const item = await this.prisma.watchlistItem.findUnique({
      where: { watchlistId_assetId: { watchlistId: watchlist.id, assetId } },
    });
    if (!item) {
      throw new NotFoundException('Watchlist item not found');
    }
    try {
      await this.prisma.watchlistItem.delete({ where: { id: item.id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException('Watchlist item not found');
      }
      throw error;
    }
  }
}
