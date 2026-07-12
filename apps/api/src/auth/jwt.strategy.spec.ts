import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';

describe('JwtStrategy', () => {
  const originalSecret = process.env.JWT_SECRET;
  let usersService: { findById: jest.Mock };
  let strategy: JwtStrategy;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  beforeEach(() => {
    usersService = { findById: jest.fn() };
    strategy = new JwtStrategy(usersService as unknown as UsersService);
  });

  it('resolves a real persisted user from the token payload', async () => {
    usersService.findById.mockResolvedValue({ id: 'user-1', email: 'trader@example.com', role: 'USER' });

    const result = await strategy.validate({ sub: 'user-1', email: 'trader@example.com', role: 'USER' });

    expect(usersService.findById).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ id: 'user-1', email: 'trader@example.com', role: 'USER' });
  });

  it('rejects a token whose user no longer exists', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'deleted-user', email: 'gone@example.com', role: 'USER' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
