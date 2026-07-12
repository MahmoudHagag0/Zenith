import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateExchangeInput, UpdateExchangeInput } from '@zenith/validation';
import { PrismaService } from '../database/prisma.service';
import { isRecordNotFoundError, isUniqueConstraintViolation } from '../common/prisma-errors';

const DUPLICATE_CODE_MESSAGE = 'Exchange code already exists';

@Injectable()
export class ExchangesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.exchange.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const exchange = await this.prisma.exchange.findUnique({ where: { id } });
    if (!exchange) {
      throw new NotFoundException('Exchange not found');
    }
    return exchange;
  }

  async create(input: CreateExchangeInput) {
    const existing = await this.prisma.exchange.findUnique({ where: { code: input.code } });
    if (existing) {
      throw new ConflictException(DUPLICATE_CODE_MESSAGE);
    }
    try {
      return await this.prisma.exchange.create({ data: input });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_CODE_MESSAGE);
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateExchangeInput) {
    await this.findOne(id);
    try {
      return await this.prisma.exchange.update({ where: { id }, data: input });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_CODE_MESSAGE);
      }
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException('Exchange not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.prisma.exchange.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException('Exchange not found');
      }
      throw error;
    }
  }
}
