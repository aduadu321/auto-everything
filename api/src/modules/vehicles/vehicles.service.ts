import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto) {
    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client negăsit');
    }

    try {
      return await this.prisma.vehicle.create({
        data: {
          clientId: dto.clientId,
          plateNumber: dto.plateNumber.toUpperCase().replace(/\s/g, ''),
          vin: dto.vin?.toUpperCase(),
          make: dto.make,
          model: dto.model,
          year: dto.year,
          engineType: dto.engineType,
          engineCapacity: dto.engineCapacity,
          color: dto.color,
        },
        include: {
          client: true,
          documents: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Un vehicul cu acest număr de înmatriculare există deja');
      }
      throw error;
    }
  }

  async findAll(clientId?: string) {
    const where: any = {};

    if (clientId) {
      where.clientId = clientId;
    }

    return this.prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        documents: {
          orderBy: { expiryDate: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        client: true,
        documents: {
          orderBy: { expiryDate: 'asc' },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicul negăsit');
    }

    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException('Vehicul negăsit');
    }

    try {
      const data: any = { ...dto };
      if (dto.plateNumber) {
        data.plateNumber = dto.plateNumber.toUpperCase().replace(/\s/g, '');
      }
      if (dto.vin) {
        data.vin = dto.vin.toUpperCase();
      }

      return await this.prisma.vehicle.update({
        where: { id },
        data,
        include: {
          client: true,
          documents: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Un vehicul cu acest număr de înmatriculare există deja');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException('Vehicul negăsit');
    }

    await this.prisma.vehicle.delete({ where: { id } });

    return { message: 'Vehicul șters cu succes' };
  }
}
