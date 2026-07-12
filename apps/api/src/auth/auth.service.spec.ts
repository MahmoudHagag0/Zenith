import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock; create: jest.Mock; verifyPassword: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      verifyPassword: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a new user and returns an access token', async () => {
    usersService.create.mockResolvedValue({ id: 'user-1', email: 'trader@example.com', role: 'USER' });

    const token = await service.register('trader@example.com', 'correct-horse-battery-staple');

    expect(usersService.create).toHaveBeenCalledWith('trader@example.com', 'correct-horse-battery-staple');
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-1', email: 'trader@example.com', role: 'USER' });
    expect(token).toBe('signed.jwt.token');
  });

  it('logs in with correct credentials and returns an access token', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'trader@example.com',
      role: 'USER',
      passwordHash: 'hash',
    });
    usersService.verifyPassword.mockResolvedValue(true);

    const token = await service.login('trader@example.com', 'correct-horse-battery-staple');

    expect(token).toBe('signed.jwt.token');
  });

  it('rejects login with an unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.login('nobody@example.com', 'whatever')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects login with an incorrect password', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'trader@example.com',
      role: 'USER',
      passwordHash: 'hash',
    });
    usersService.verifyPassword.mockResolvedValue(false);

    await expect(service.login('trader@example.com', 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
