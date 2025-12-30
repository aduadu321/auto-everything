import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      this.logger.warn('ADMIN_EMAIL sau ADMIN_PASSWORD nu sunt setate în .env');
      return;
    }

    const existingAdmin = await this.prisma.tenantUser.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await this.prisma.tenantUser.create({
        data: {
          email: adminEmail,
          name: 'Admin',
          role: 'OWNER',
          isActive: true,
          passwordHash,
        },
      });
      this.logger.log('Admin user creat: ' + adminEmail);
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.tenantUser.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email sau parolă incorectă');
    }

    // Check if user has passwordHash (for backwards compatibility)
    if (!user.passwordHash) {
      throw new UnauthorizedException('Cont fără parolă setată. Contactează administratorul.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email sau parolă incorectă');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.tenantUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilizator negăsit');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.tenantUser.findUnique({
      where: { id: userId, isActive: true },
    });
  }
}
