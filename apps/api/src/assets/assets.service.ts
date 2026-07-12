import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateAssetInput, UpdateAssetInput } from '@zenith/validation';
import { PrismaService } from '../database/prisma.service';
import { isRecordNotFoundError, isUniqueConstraintViolation } from '../common/prisma-errors';

const DUPLICATE_SYMBOL_MESSAGE = 'An asset with this symbol already exists in this market';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(marketId?: string) {
    return this.prisma.asset.findMany({
      where: marketId ? { marketId } : undefined,
      orderBy: { symbol: 'asc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  async create(input: CreateAssetInput) {
    const market = await this.prisma.market.findUnique({ where: { id: input.marketId } });
    if (!market) {
      throw new NotFoundException('Market not found');
    }
    const existing = await this.prisma.asset.findUnique({
      where: { marketId_symbol: { marketId: input.marketId, symbol: input.symbol } },
    });
    if (existing) {
      throw new ConflictException(DUPLICATE_SYMBOL_MESSAGE);
    }
    try {
      return await this.prisma.asset.create({ data: input });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_SYMBOL_MESSAGE);
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateAssetInput) {
    const asset = await this.findOne(id);
    try {
      return await this.prisma.asset.update({ where: { id: asset.id }, data: input });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_SYMBOL_MESSAGE);
      }
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException('Asset not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.prisma.asset.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException('Asset not found');
      }
      throw error;
    }
  }
}
