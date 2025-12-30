import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto, DocumentQueryDto } from './dto/document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto) {
    // Verify vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicul negăsit');
    }

    const expiryDate = new Date(dto.expiryDate);
    const status = this.calculateStatus(expiryDate);

    return this.prisma.document.create({
      data: {
        vehicleId: dto.vehicleId,
        type: dto.type,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate,
        documentNumber: dto.documentNumber,
        issuedBy: dto.issuedBy,
        cost: dto.cost,
        insuranceType: dto.insuranceType,
        insuranceCompany: dto.insuranceCompany,
        vignetteType: dto.vignetteType,
        notes: dto.notes,
        status,
      },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  async findAll(query: DocumentQueryDto) {
    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.expiringInDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + query.expiringInDays);
      where.expiryDate = {
        lte: targetDate,
        gte: new Date(),
      };
      where.status = { in: ['ACTIVE', 'EXPIRING_SOON'] };
    }

    return this.prisma.document.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
      include: {
        vehicle: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                preferSms: true,
                preferEmail: true,
              },
            },
          },
        },
      },
    });
  }

  async findExpiring(days: number = 30) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return this.prisma.document.findMany({
      where: {
        expiryDate: {
          lte: targetDate,
          gte: new Date(),
        },
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
      },
      orderBy: { expiryDate: 'asc' },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
        notifications: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document negăsit');
    }

    return document;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const document = await this.prisma.document.findUnique({ where: { id } });

    if (!document) {
      throw new NotFoundException('Document negăsit');
    }

    const data: any = { ...dto };

    if (dto.issueDate) {
      data.issueDate = new Date(dto.issueDate);
    }

    if (dto.expiryDate) {
      data.expiryDate = new Date(dto.expiryDate);
      data.status = this.calculateStatus(data.expiryDate);
      // Reset notification flags when expiry date changes
      data.notifiedDays30 = false;
      data.notifiedDays14 = false;
      data.notifiedDays7 = false;
      data.notifiedDays3 = false;
      data.notifiedDays1 = false;
      data.notifiedExpired = false;
    }

    return this.prisma.document.update({
      where: { id },
      data,
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });

    if (!document) {
      throw new NotFoundException('Document negăsit');
    }

    await this.prisma.document.delete({ where: { id } });

    return { message: 'Document șters cu succes' };
  }

  async renew(id: string, newExpiryDate: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });

    if (!document) {
      throw new NotFoundException('Document negăsit');
    }

    // Mark old document as renewed
    await this.prisma.document.update({
      where: { id },
      data: { status: 'RENEWED' },
    });

    // Create new document
    const expiryDate = new Date(newExpiryDate);

    return this.prisma.document.create({
      data: {
        vehicleId: document.vehicleId,
        type: document.type,
        issueDate: new Date(),
        expiryDate,
        documentNumber: document.documentNumber,
        issuedBy: document.issuedBy,
        insuranceType: document.insuranceType,
        insuranceCompany: document.insuranceCompany,
        vignetteType: document.vignetteType,
        status: this.calculateStatus(expiryDate),
      },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  async getStats() {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalDocuments,
      expiredCount,
      expiringIn7Days,
      expiringIn30Days,
      itpCount,
      rcaCount,
      vignetteCount,
    ] = await Promise.all([
      this.prisma.document.count({ where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } } }),
      this.prisma.document.count({ where: { status: 'EXPIRED' } }),
      this.prisma.document.count({
        where: {
          expiryDate: { lte: in7Days, gte: now },
          status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        },
      }),
      this.prisma.document.count({
        where: {
          expiryDate: { lte: in30Days, gte: now },
          status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        },
      }),
      this.prisma.document.count({ where: { type: 'ITP', status: { in: ['ACTIVE', 'EXPIRING_SOON'] } } }),
      this.prisma.document.count({ where: { type: 'RCA', status: { in: ['ACTIVE', 'EXPIRING_SOON'] } } }),
      this.prisma.document.count({ where: { type: 'VIGNETTE', status: { in: ['ACTIVE', 'EXPIRING_SOON'] } } }),
    ]);

    return {
      totalDocuments,
      expiredCount,
      expiringIn7Days,
      expiringIn30Days,
      byType: {
        itp: itpCount,
        rca: rcaCount,
        vignette: vignetteCount,
      },
    };
  }

  // Update document statuses (run periodically)
  async updateStatuses() {
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Mark expired documents
    await this.prisma.document.updateMany({
      where: {
        expiryDate: { lt: now },
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
      },
      data: { status: 'EXPIRED' },
    });

    // Mark expiring soon documents
    await this.prisma.document.updateMany({
      where: {
        expiryDate: { gte: now, lte: in14Days },
        status: 'ACTIVE',
      },
      data: { status: 'EXPIRING_SOON' },
    });

    return { message: 'Statusuri actualizate' };
  }

  private calculateStatus(expiryDate: Date): 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' {
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return 'EXPIRED';
    } else if (daysUntilExpiry <= 14) {
      return 'EXPIRING_SOON';
    } else {
      return 'ACTIVE';
    }
  }
}
