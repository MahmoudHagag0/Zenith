import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { JournalService } from './journal.service';
import { PrismaService } from '../database/prisma.service';

describe('JournalService', () => {
  let service: JournalService;
  let prisma: {
    journalEntry: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    transaction: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      journalEntry: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      transaction: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [JournalService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<JournalService>(JournalService);
  });

  it('creates a journal entry owned by the requesting user', async () => {
    prisma.journalEntry.create.mockResolvedValue({ id: 'je-1', userId: 'user-1', title: 'Good trade' });

    const entry = await service.create('user-1', { title: 'Good trade', content: 'Followed the plan', tags: [] });

    expect(entry.userId).toBe('user-1');
    expect(prisma.transaction.findUnique).not.toHaveBeenCalled();
  });

  it('links a journal entry to a transaction owned by the requesting user', async () => {
    prisma.transaction.findUnique.mockResolvedValue({
      id: 'tx-1',
      position: { portfolio: { userId: 'user-1' } },
    });
    prisma.journalEntry.create.mockResolvedValue({ id: 'je-1', userId: 'user-1', transactionId: 'tx-1' });

    const entry = await service.create('user-1', {
      title: 'Good trade',
      content: 'Followed the plan',
      tags: [],
      transactionId: 'tx-1',
    });

    expect(entry.transactionId).toBe('tx-1');
  });

  it('rejects linking a journal entry to a transaction owned by another user', async () => {
    prisma.transaction.findUnique.mockResolvedValue({
      id: 'tx-1',
      position: { portfolio: { userId: 'someone-else' } },
    });

    await expect(
      service.create('user-1', { title: 'Good trade', content: 'Followed the plan', tags: [], transactionId: 'tx-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.journalEntry.create).not.toHaveBeenCalled();
  });

  it('rejects linking a journal entry to a non-existent transaction', async () => {
    prisma.transaction.findUnique.mockResolvedValue(null);

    await expect(
      service.create('user-1', { title: 'Good trade', content: 'Followed the plan', tags: [], transactionId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 (not 403) when a journal entry exists but is owned by another user', async () => {
    prisma.journalEntry.findUnique.mockResolvedValue({ id: 'je-1', userId: 'someone-else' });

    await expect(service.findOne('user-1', 'je-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for a journal entry that does not exist at all', async () => {
    prisma.journalEntry.findUnique.mockResolvedValue(null);

    await expect(service.findOne('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects updating a journal entry owned by another user', async () => {
    prisma.journalEntry.findUnique.mockResolvedValue({ id: 'je-1', userId: 'someone-else' });

    await expect(service.update('user-1', 'je-1', { title: 'Edited' })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.journalEntry.update).not.toHaveBeenCalled();
  });

  it('rejects removing a journal entry owned by another user', async () => {
    prisma.journalEntry.findUnique.mockResolvedValue({ id: 'je-1', userId: 'someone-else' });

    await expect(service.remove('user-1', 'je-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.journalEntry.delete).not.toHaveBeenCalled();
  });

  it('converts a concurrent record-not-found on update into a clean 404', async () => {
    prisma.journalEntry.findUnique.mockResolvedValue({ id: 'je-1', userId: 'user-1' });
    const recordNotFound = new Prisma.PrismaClientKnownRequestError('Record to update not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
    prisma.journalEntry.update.mockRejectedValue(recordNotFound);

    await expect(service.update('user-1', 'je-1', { title: 'Edited' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
