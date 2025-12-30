import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PrismaMasterService } from '../../database/prisma-master.service';

export interface DashboardStats {
  overview: {
    totalClients: number;
    totalVehicles: number;
    totalAppointments: number;
    smsCredits: number;
  };
  appointments: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  itpExpiring: {
    next7Days: number;
    next30Days: number;
    expired: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'appointment' | 'client' | 'sms';
    description: string;
    timestamp: Date;
  }>;
  subscription: {
    plan: string;
    status: string;
    smsCredits: number;
    currentPeriodEnd: Date | null;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaMaster: PrismaMasterService,
  ) {}

  async getStats(userId: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const next7Days = new Date(startOfToday);
    next7Days.setDate(next7Days.getDate() + 7);
    const next30Days = new Date(startOfToday);
    next30Days.setDate(next30Days.getDate() + 30);

    // For now, return mock data since Prisma client is not generated
    // In production, these would be real database queries
    const mockStats: DashboardStats = {
      overview: {
        totalClients: 156,
        totalVehicles: 203,
        totalAppointments: 1247,
        smsCredits: 850,
      },
      appointments: {
        today: 8,
        thisWeek: 34,
        thisMonth: 127,
        pending: 12,
        completed: 1180,
        cancelled: 55,
      },
      revenue: {
        thisMonth: 12450,
        lastMonth: 10200,
        growth: 22.1,
      },
      itpExpiring: {
        next7Days: 15,
        next30Days: 48,
        expired: 7,
      },
      recentActivity: [
        {
          id: '1',
          type: 'appointment',
          description: 'Programare nouă: Ion Popescu - B 123 ABC',
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
        },
        {
          id: '2',
          type: 'sms',
          description: 'SMS trimis: Reminder ITP pentru 5 clienți',
          timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
        },
        {
          id: '3',
          type: 'appointment',
          description: 'ITP finalizat: Maria Ionescu - SV 99 XYZ',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          id: '4',
          type: 'client',
          description: 'Client nou: Auto Service Popescu SRL',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        },
        {
          id: '5',
          type: 'appointment',
          description: 'Programare anulată: George Vasile - IF 55 DEF',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        },
      ],
      subscription: {
        plan: 'STARTER',
        status: 'active',
        smsCredits: 850,
        currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      },
    };

    return mockStats;

    // TODO: Uncomment when Prisma client is properly generated
    /*
    // Get tenant info
    const user = await this.prismaMaster.user.findUnique({
      where: { id: userId },
      include: { tenants: true },
    });
    const tenant = user?.tenants[0];

    // Overview stats
    const [totalClients, totalVehicles, totalAppointments] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.vehicle.count(),
      this.prisma.appointment.count(),
    ]);

    // Appointment stats
    const [todayAppointments, weekAppointments, monthAppointments, pendingAppointments, completedAppointments, cancelledAppointments] = await Promise.all([
      this.prisma.appointment.count({ where: { scheduledAt: { gte: startOfToday } } }),
      this.prisma.appointment.count({ where: { scheduledAt: { gte: startOfWeek } } }),
      this.prisma.appointment.count({ where: { scheduledAt: { gte: startOfMonth } } }),
      this.prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.appointment.count({ where: { status: 'CANCELLED' } }),
    ]);

    // ITP expiring
    const [expiringNext7, expiringNext30, expired] = await Promise.all([
      this.prisma.document.count({
        where: {
          type: 'ITP',
          expiresAt: { gte: startOfToday, lte: next7Days },
        },
      }),
      this.prisma.document.count({
        where: {
          type: 'ITP',
          expiresAt: { gte: startOfToday, lte: next30Days },
        },
      }),
      this.prisma.document.count({
        where: {
          type: 'ITP',
          expiresAt: { lt: startOfToday },
        },
      }),
    ]);

    return {
      overview: {
        totalClients,
        totalVehicles,
        totalAppointments,
        smsCredits: tenant?.smsCredits || 0,
      },
      appointments: {
        today: todayAppointments,
        thisWeek: weekAppointments,
        thisMonth: monthAppointments,
        pending: pendingAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
      },
      revenue: {
        thisMonth: 0, // Would come from billing
        lastMonth: 0,
        growth: 0,
      },
      itpExpiring: {
        next7Days: expiringNext7,
        next30Days: expiringNext30,
        expired,
      },
      recentActivity: [],
      subscription: {
        plan: tenant?.plan || 'FREE',
        status: tenant?.subscriptionStatus || 'inactive',
        smsCredits: tenant?.smsCredits || 0,
        currentPeriodEnd: tenant?.currentPeriodEnd || null,
      },
    };
    */
  }

  async getChartData(userId: string, period: 'week' | 'month' | 'year') {
    // Mock chart data
    const labels = period === 'week'
      ? ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum']
      : period === 'month'
      ? Array.from({ length: 30 }, (_, i) => `${i + 1}`)
      : ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const appointments = labels.map(() => Math.floor(Math.random() * 20) + 5);
    const revenue = labels.map(() => Math.floor(Math.random() * 5000) + 1000);

    return {
      labels,
      datasets: {
        appointments,
        revenue,
      },
    };
  }
}
