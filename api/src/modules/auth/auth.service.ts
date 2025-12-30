import { Injectable, UnauthorizedException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { PrismaMasterService } from '../../database/prisma-master.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaMaster: PrismaMasterService,
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

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existingUser = await this.prismaMaster.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Acest email este deja înregistrat');
    }

    // Generate slug from business name
    const slug = this.generateSlug(dto.businessName);

    // Check if slug already exists
    const existingTenant = await this.prismaMaster.tenant.findFirst({
      where: { slug },
    });

    if (existingTenant) {
      throw new ConflictException('Numele afacerii este deja utilizat. Încercați alt nume.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user and tenant in a transaction
    const result = await this.prismaMaster.$transaction(async (tx) => {
      // Create user first
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.name,
          phone: dto.phone,
        },
      });

      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.businessName,
          slug,
          businessType: dto.businessType as any,
          phone: dto.phone,
          county: dto.county,
          city: dto.city,
          address: dto.address,
          databaseUrl: process.env.TENANT_DATABASE_URL || '',
          ownerId: user.id,
          plan: 'FREE',
          smsCredits: 100,
        },
      });

      // Also create tenantUser in tenant DB for login
      await this.prisma.tenantUser.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.name,
          role: 'OWNER',
          isActive: true,
        },
      });

      return { user, tenant };
    });

    // Generate JWT token
    const payload = { sub: result.user.id, email: result.user.email, role: 'OWNER' };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`New user registered: ${dto.email} with tenant: ${result.tenant.name}`);

    return {
      accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name || undefined,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove multiple hyphens
  }
}
