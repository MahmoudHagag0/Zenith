import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateJournalEntryInput, UpdateJournalEntryInput } from '@zenith/validation';
import { PrismaService } from '../database/prisma.service';
import { isRecordNotFoundError } from '../common/prisma-errors';

const NOT_FOUND_MESSAGE = 'Journal entry not found';
const TRANSACTION_NOT_FOUND_MESSAGE = 'Transaction not found';

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.journalEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(userId: string, id: string) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    // An entry that exists but belongs to another user is reported as 404, not
    // 403, to avoid confirming the existence of another user's resource ID
    // (same convention as WatchlistsService/PortfoliosService).
    if (!entry || entry.userId !== userId) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
    return entry;
  }

  async create(userId: string, input: CreateJournalEntryInput) {
    if (input.transactionId) {
      await this.verifyTransactionOwnership(userId, input.transactionId);
    }
    return this.prisma.journalEntry.create({
      data: {
        userId,
        title: input.title,
        content: input.content,
        tags: input.tags,
        transactionId: input.transactionId,
      },
    });
  }

  async update(userId: string, id: string, input: UpdateJournalEntryInput) {
    const entry = await this.findOne(userId, id);
    if (input.transactionId) {
      await this.verifyTransactionOwnership(userId, input.transactionId);
    }
    try {
      return await this.prisma.journalEntry.update({ where: { id: entry.id }, data: input });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException(NOT_FOUND_MESSAGE);
      }
      throw error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    const entry = await this.findOne(userId, id);
    try {
      await this.prisma.journalEntry.delete({ where: { id: entry.id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException(NOT_FOUND_MESSAGE);
      }
      throw error;
    }
  }

  // Walks Transaction -> Position -> Portfolio to confirm the transaction
  // belongs to the requesting user, the same ownership chain PositionsService
  // already relies on for buy/sell -- a journal entry must not be linkable to
  // another user's trade history.
  private async verifyTransactionOwnership(userId: string, transactionId: string): Promise<void> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { position: { include: { portfolio: true } } },
    });
    if (!transaction || transaction.position.portfolio.userId !== userId) {
      throw new NotFoundException(TRANSACTION_NOT_FOUND_MESSAGE);
    }
  }
}
