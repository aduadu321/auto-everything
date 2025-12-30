import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.holiday.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    return this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async create(data: { name: string; date: Date; isRecurring?: boolean }) {
    return this.prisma.holiday.create({
      data: {
        name: data.name,
        date: data.date,
        isRecurring: data.isRecurring || false,
        isOrthodox: false,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.holiday.delete({
      where: { id },
    });
  }

  async deleteByDate(date: string) {
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return this.prisma.holiday.deleteMany({
      where: {
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });
  }
}
