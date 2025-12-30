import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface ScheduleDay {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface NotificationSettings {
  enableSms: boolean;
  enableEmail: boolean;
  reminderDays: number[];
  sendTime: string;
}

interface SmsGatewaySettings {
  useOwnGateway: boolean;
  deviceConnected: boolean;
}

export interface OnboardingData {
  schedule: ScheduleDay[];
  notifications: NotificationSettings;
  smsGateway: SmsGatewaySettings;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private prisma: PrismaService) {}

  async completeOnboarding(tenantId: string, data: OnboardingData) {
    this.logger.log(`Completing onboarding for tenant: ${tenantId}`);

    // Get tenant's database connection
    const tenantClient = this.prisma.tenant(tenantId);

    // Save working hours schedule
    await this.saveSchedule(tenantClient, data.schedule);

    // Save notification settings to tenant configuration
    await this.saveNotificationSettings(tenantId, data.notifications);

    // Save SMS gateway preference
    await this.saveSmsGatewaySettings(tenantId, data.smsGateway);

    // Mark tenant as onboarded
    await this.prisma.master.tenant.update({
      where: { id: tenantId },
      data: {
        isOnboarded: true,
        onboardedAt: new Date(),
      },
    });

    this.logger.log(`Onboarding completed for tenant: ${tenantId}`);

    return { success: true };
  }

  private async saveSchedule(tenantClient: any, schedule: ScheduleDay[]) {
    // Delete existing schedule
    await tenantClient.workingHours.deleteMany({});

    // Create new schedule entries
    for (const day of schedule) {
      if (day.isOpen) {
        await tenantClient.workingHours.create({
          data: {
            dayOfWeek: day.dayOfWeek,
            openTime: day.openTime,
            closeTime: day.closeTime,
            isOpen: true,
          },
        });
      }
    }
  }

  private async saveNotificationSettings(tenantId: string, settings: NotificationSettings) {
    await this.prisma.master.tenant.update({
      where: { id: tenantId },
      data: {
        notificationSettings: {
          enableSms: settings.enableSms,
          enableEmail: settings.enableEmail,
          reminderDays: settings.reminderDays,
          sendTime: settings.sendTime,
        },
      },
    });
  }

  private async saveSmsGatewaySettings(tenantId: string, settings: SmsGatewaySettings) {
    await this.prisma.master.tenant.update({
      where: { id: tenantId },
      data: {
        smsGatewayType: settings.useOwnGateway ? 'OWN_DEVICE' : 'SHARED',
      },
    });
  }

  async getOnboardingStatus(tenantId: string) {
    const tenant = await this.prisma.master.tenant.findUnique({
      where: { id: tenantId },
      select: {
        isOnboarded: true,
        onboardedAt: true,
      },
    });

    return {
      isOnboarded: tenant?.isOnboarded ?? false,
      onboardedAt: tenant?.onboardedAt,
    };
  }
}
