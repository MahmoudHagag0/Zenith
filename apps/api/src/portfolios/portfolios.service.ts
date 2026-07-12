import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreatePortfolioInput, UpdatePortfolioInput } from '@zenith/validation';
import { PrismaService } from '../database/prisma.service';
import { isRecordNotFoundError, isUniqueConstraintViolation } from '../common/prisma-errors';

const DUPLICATE_NAME_MESSAGE = 'A portfolio with this name already exists';
const NOT_FOUND_MESSAGE = 'Portfolio not found';

@Injectable()
export class PortfoliosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.portfolio.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  }

  async findOwned(userId: string, id: string) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { id } });
    // A portfolio that exists but belongs to another user is reported as 404,
    // not 403, to avoid confirming the existence of another user's resource ID.
    if (!portfolio || portfolio.userId !== userId) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
    return portfolio;
  }

  async create(userId: string, input: CreatePortfolioInput) {
    const existing = await this.prisma.portfolio.findUnique({
      where: { userId_name: { userId, name: input.name } },
    });
    if (existing) {
      throw new ConflictException(DUPLICATE_NAME_MESSAGE);
    }
    try {
      return await this.prisma.portfolio.create({ data: { userId, name: input.name } });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(DUPLICATE_NAME_MESSAGE);
      }
      throw error;
    }
  }

  async update(userId: string, id: string, input: UpdatePortfolioInput) {
    const portfolio = await this.findOwned(userId, id);
    try {
      return await this.prisma.portfolio.update({ where: { id: portfolio.id }, data: input });
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
    const portfolio = await this.findOwned(userId, id);
    try {
      await this.prisma.portfolio.delete({ where: { id: portfolio.id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException(NOT_FOUND_MESSAGE);
      }
      throw error;
    }
  }
}
