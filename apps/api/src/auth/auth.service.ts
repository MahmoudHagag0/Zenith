import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  sign(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  async register(email: string, password: string): Promise<string> {
    const user = await this.usersService.create(email, password);
    return this.sign({ sub: user.id, email: user.email, role: user.role });
  }

  async login(email: string, password: string): Promise<string> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await this.usersService.verifyPassword(user.passwordHash, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.sign({ sub: user.id, email: user.email, role: user.role });
  }
}
