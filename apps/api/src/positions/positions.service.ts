import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import type { BuyInput, SellInput } from '@zenith/validation';
import { PrismaService } from '../database/prisma.service';
import { PortfoliosService } from '../portfolios/portfolios.service';

const ZERO = new Prisma.Decimal(0);

@Injectable()
export class PositionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portfoliosService: PortfoliosService,
  ) {}

  private withCostBasis<T extends { quantity: Prisma.Decimal; averageCost: Prisma.Decimal }>(position: T) {
    return { ...position, costBasis: position.quantity.times(position.averageCost) };
  }

  async findAll(userId: string, portfolioId: string) {
    await this.portfoliosService.findOwned(userId, portfolioId);
    const positions = await this.prisma.position.findMany({ where: { portfolioId }, orderBy: { createdAt: 'asc' } });
    return positions.map((position) => this.withCostBasis(position));
  }

  async findOne(userId: string, portfolioId: string, positionId: string) {
    await this.portfoliosService.findOwned(userId, portfolioId);
    const position = await this.prisma.position.findUnique({ where: { id: positionId } });
    if (!position || position.portfolioId !== portfolioId) {
      throw new NotFoundException('Position not found');
    }
    return this.withCostBasis(position);
  }

  async listTransactions(userId: string, portfolioId: string, positionId: string) {
    await this.portfoliosService.findOwned(userId, portfolioId);
    const position = await this.prisma.position.findUnique({ where: { id: positionId } });
    if (!position || position.portfolioId !== portfolioId) {
      throw new NotFoundException('Position not found');
    }
    return this.prisma.transaction.findMany({ where: { positionId }, orderBy: { executedAt: 'asc' } });
  }

  async buy(userId: string, portfolioId: string, input: BuyInput) {
    await this.portfoliosService.findOwned(userId, portfolioId);
    const asset = await this.prisma.asset.findUnique({ where: { id: input.assetId } });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const quantity = new Prisma.Decimal(input.quantity);
    const price = new Prisma.Decimal(input.price);
    const executedAt = input.executedAt ? new Date(input.executedAt) : new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      // upsert is a single atomic INSERT ... ON CONFLICT at the database level,
      // so concurrent first-buys for the same portfolio+asset cannot race each
      // other into duplicate rows or a mid-transaction unique-constraint error.
      const created = await tx.position.upsert({
        where: { portfolioId_assetId: { portfolioId, assetId: input.assetId } },
        create: { portfolioId, assetId: input.assetId, quantity: 0, averageCost: 0, realizedPnl: 0 },
        update: {},
      });

      // Row-lock the position for the rest of this transaction (DEC-2026-005),
      // so a concurrent buy/sell for the same position serializes instead of
      // reading stale totals and losing an update.
      const position = await this.lockAndRefetch(tx, created.id);

      const newQuantity = position.quantity.plus(quantity);
      const newAverageCost = position.quantity
        .times(position.averageCost)
        .plus(quantity.times(price))
        .div(newQuantity);

      const result = await tx.position.update({
        where: { id: position.id },
        data: { quantity: newQuantity, averageCost: newAverageCost },
      });
      await tx.transaction.create({
        data: { positionId: position.id, type: 'BUY', quantity, price, executedAt },
      });
      return result;
    });

    return this.withCostBasis(updated);
  }

  async sell(userId: string, portfolioId: string, input: SellInput) {
    await this.portfoliosService.findOwned(userId, portfolioId);
    const asset = await this.prisma.asset.findUnique({ where: { id: input.assetId } });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const quantity = new Prisma.Decimal(input.quantity);
    const price = new Prisma.Decimal(input.price);
    const executedAt = input.executedAt ? new Date(input.executedAt) : new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.position.findUnique({
        where: { portfolioId_assetId: { portfolioId, assetId: input.assetId } },
      });
      if (!existing) {
        throw new NotFoundException('No position exists for this asset in this portfolio');
      }

      // Row-lock before validating/recomputing (DEC-2026-005) — see buy() above.
      const position = await this.lockAndRefetch(tx, existing.id);

      if (quantity.greaterThan(position.quantity)) {
        throw new BadRequestException('Cannot sell more than the currently held quantity');
      }

      const realizedGain = quantity.times(price.minus(position.averageCost));
      const newQuantity = position.quantity.minus(quantity);
      const newAverageCost = newQuantity.isZero() ? ZERO : position.averageCost;

      const result = await tx.position.update({
        where: { id: position.id },
        data: {
          quantity: newQuantity,
          averageCost: newAverageCost,
          realizedPnl: position.realizedPnl.plus(realizedGain),
        },
      });
      await tx.transaction.create({
        data: { positionId: position.id, type: 'SELL', quantity, price, executedAt },
      });
      return result;
    });

    return this.withCostBasis(updated);
  }

  async remove(userId: string, portfolioId: string, positionId: string): Promise<void> {
    await this.portfoliosService.findOwned(userId, portfolioId);
    const position = await this.prisma.position.findUnique({ where: { id: positionId } });
    if (!position || position.portfolioId !== portfolioId) {
      throw new NotFoundException('Position not found');
    }
    if (!position.quantity.isZero()) {
      throw new BadRequestException('Cannot delete an open position — sell the full quantity first');
    }
    await this.prisma.position.delete({ where: { id: position.id } });
  }

  private async lockAndRefetch(tx: Prisma.TransactionClient, positionId: string) {
    await tx.$queryRaw`SELECT id FROM "Position" WHERE id = ${positionId} FOR UPDATE`;
    return tx.position.findUniqueOrThrow({ where: { id: positionId } });
  }
}
