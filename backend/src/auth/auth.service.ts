import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DbService } from '../db/db.service.js';
import * as schema from '../db/schema.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DbService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async validateUser(email: string, pass: string): Promise<AuthenticatedUser> {
    const [user] = await this.dbService.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async login(loginDto: LoginDto): Promise<{ user: AuthenticatedUser; token: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const token = await this.generateToken(user);
    return { user, token };
  }

  async register(registerDto: RegisterDto): Promise<{ user: AuthenticatedUser; token: string }> {
    const email = registerDto.email.toLowerCase().trim();
    const [existing] = await this.dbService.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const [newUser] = await this.dbService.db
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        name: registerDto.name.trim(),
        role: registerDto.role || 'STUDENT',
      })
      .returning();

    const user: AuthenticatedUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const token = await this.generateToken(user);
    return { user, token };
  }

  async getUserById(id: string): Promise<AuthenticatedUser | null> {
    const [user] = await this.dbService.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return user || null;
  }

  async verifyToken(token: string): Promise<AuthenticatedUser> {
    const secret =
      this.configService.get<string>('JWT_SECRET') ||
      'super_secret_jwt_key_kingdom_of_chess_2026';
    return this.jwtService.verifyAsync<AuthenticatedUser>(token, { secret });
  }

  private async generateToken(user: AuthenticatedUser): Promise<string> {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const secret =
      this.configService.get<string>('JWT_SECRET') ||
      'super_secret_jwt_key_kingdom_of_chess_2026';

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '7d',
    });
  }
}

