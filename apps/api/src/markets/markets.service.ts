import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateMarketInput, UpdateMarketInput } from '@zenith/validation';
import { PrismaService } from '../database/prisma.service';
import { isRecordNotFoundError, isUniqueConstraintViolation } from '../common/prisma-errors';

const DUPLICATE_NAME_MESSAGE = 'A market with this name already exists on this exchange';

@Injectable()
export class MarketsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(exchangeId?: string) {
    return this.prisma.market.findMany({
      where: exchangeId ? { exchangeId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const market = await this.prisma.market.findUnique({ where: { id } });
    if (!market) {
      throw new NotFoundException('Market not found');
    }
    return market;
  }

  async create(input: CreateMarketInput) {
    const exchange = await this.prisma.exchange.findUnique({ where: { id: input.exchangeId } });
    if (!exchange) {
      throw new NotFoundException('Exchange not found');
    }
    const existing = await this.prisma.market.findUnique({
      where: { exchangeId_name: { exchangeId: input.exchangeId, name: input.name } },
    });
    if (existing) {
      throw new ConflictException(DUPLICATE_NAME_MESSAGE);
    }
    try {
      return await this.prisma.market.create({ data: input });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_NAME_MESSAGE);
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateMarketInput) {
    const market = await this.findOne(id);
    try {
      return await this.prisma.market.update({ where: { id: market.id }, data: input });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_NAME_MESSAGE);
      }
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException('Market not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.prisma.market.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException('Market not found');
      }
      throw error;
    }
  }
}
