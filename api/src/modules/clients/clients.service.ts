import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto, UpdateClientDto, ClientQueryDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    try {
      return await this.prisma.client.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          city: dto.city,
          county: dto.county,
          preferSms: dto.preferSms ?? true,
          preferEmail: dto.preferEmail ?? false,
          notes: dto.notes,
        },
        include: {
          vehicles: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Un client cu acest număr de telefon există deja');
      }
      throw error;
    }
  }

  async findAll(query: ClientQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicles: {
            include: {
              documents: {
                where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
                orderBy: { expiryDate: 'asc' },
              },
            },
          },
          _count: {
            select: { vehicles: true, notifications: true },
          },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        vehicles: {
          include: {
            documents: {
              orderBy: { expiryDate: 'asc' },
            },
          },
        },
        notifications: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client negăsit');
    }

    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException('Client negăsit');
    }

    try {
      return await this.prisma.client.update({
        where: { id },
        data: dto,
        include: {
          vehicles: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Un client cu acest număr de telefon există deja');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException('Client negăsit');
    }

    await this.prisma.client.delete({ where: { id } });

    return { message: 'Client șters cu succes' };
  }

  async getStats() {
    const [totalClients, activeClients, totalVehicles, expiringDocuments] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { isActive: true } }),
      this.prisma.vehicle.count(),
      this.prisma.document.count({
        where: {
          status: 'EXPIRING_SOON',
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      totalClients,
      activeClients,
      totalVehicles,
      expiringDocuments,
    };
  }
}
