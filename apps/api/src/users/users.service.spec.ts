import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('creates a user with an Argon2id password hash', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => ({ id: 'user-1', ...data }));

    const user = await service.create('trader@example.com', 'correct-horse-battery-staple');

    expect(prisma.user.create).toHaveBeenCalled();
    const createArgs = prisma.user.create.mock.calls[0][0].data;
    expect(createArgs.email).toBe('trader@example.com');
    expect(createArgs.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user.email).toBe('trader@example.com');
  });

  it('rejects registration with a duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user', email: 'trader@example.com' });

    await expect(service.create('trader@example.com', 'another-password')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('verifies a correct password against its hash', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => ({ id: 'user-1', ...data }));
    const user = await service.create('trader@example.com', 'correct-horse-battery-staple');

    await expect(service.verifyPassword(user.passwordHash, 'correct-horse-battery-staple')).resolves.toBe(
      true,
    );
    await expect(service.verifyPassword(user.passwordHash, 'wrong-password')).resolves.toBe(false);
  });
});
