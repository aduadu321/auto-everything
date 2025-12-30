import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Rulează zilnic la ora 8:00 dimineața
  @Cron('0 8 * * *')
  async handleDailyNotifications() {
    this.logger.log('Starting daily notification check...');

    try {
      // Actualizează statusurile documentelor
      await this.updateDocumentStatuses();

      // Trimite notificări pentru documentele care expiră în 7 zile
      await this.sendExpirationNotifications();

      this.logger.log('Daily notification check completed.');
    } catch (error) {
      this.logger.error('Error in daily notification check:', error);
    }
  }

  // Poate fi apelat manual pentru testare
  async runManualCheck() {
    this.logger.log('Running manual notification check...');
    await this.updateDocumentStatuses();
    await this.sendExpirationNotifications();
    return { message: 'Verificare manuală completată' };
  }

  private async updateDocumentStatuses() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Marchează documentele expirate
    await this.prisma.document.updateMany({
      where: {
        expiryDate: { lt: now },
        status: { not: 'EXPIRED' },
      },
      data: { status: 'EXPIRED' },
    });

    // Marchează documentele care expiră în curând (7 zile)
    await this.prisma.document.updateMany({
      where: {
        expiryDate: { gte: now, lte: sevenDaysFromNow },
        status: 'ACTIVE',
      },
      data: { status: 'EXPIRING_SOON' },
    });

    this.logger.log('Document statuses updated');
  }

  private async sendExpirationNotifications() {
    // Trimite notificări doar pentru 7 zile înainte de expirare
    await this.sendNotificationsForInterval(7, 'notifiedDays7');
  }

  private async sendNotificationsForInterval(days: number, flagField: string) {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);

    // Găsește documente care expiră în intervalul specificat
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const documents = await this.prisma.document.findMany({
      where: {
        expiryDate: { gte: startOfDay, lte: endOfDay },
        [flagField]: false,
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
      },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
      },
    });

    this.logger.log(`Found ${documents.length} documents expiring in ${days} days`);

    // Găsește template-ul potrivit pentru acest interval
    for (const doc of documents) {
      const template = await this.prisma.notificationTemplate.findFirst({
        where: {
          type: doc.type,
          triggerDays: days,
          isActive: true,
        },
      });

      if (!template) {
        this.logger.warn(`No template found for ${doc.type} at ${days} days`);
        continue;
      }

      const client = doc.vehicle.client;

      // Trimite SMS dacă este activat și clientul are telefon
      if (template.smsEnabled && client.phone) {
        try {
          await this.notificationsService.sendNotification(doc.id, 'SMS', template.id);
          this.logger.log(`SMS sent to ${client.phone} for document ${doc.id}`);
        } catch (error) {
          this.logger.error(`Failed to send SMS for document ${doc.id}:`, error);
        }
      }

      // Trimite Email dacă este activat și clientul are email
      if (template.emailEnabled && client.email) {
        try {
          await this.notificationsService.sendNotification(doc.id, 'EMAIL', template.id);
          this.logger.log(`Email sent to ${client.email} for document ${doc.id}`);
        } catch (error) {
          this.logger.error(`Failed to send email for document ${doc.id}:`, error);
        }
      }

      // Marchează documentul ca notificat pentru acest interval
      await this.prisma.document.update({
        where: { id: doc.id },
        data: { [flagField]: true },
      });
    }
  }

  // Statistici pentru dashboard
  async getSchedulerStats() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [
      totalDocuments,
      expiringDocuments,
      expiredDocuments,
      todayNotifications,
    ] = await Promise.all([
      this.prisma.document.count(),
      this.prisma.document.count({
        where: {
          expiryDate: { gte: now, lte: sevenDaysFromNow },
          status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        },
      }),
      this.prisma.document.count({
        where: { status: 'EXPIRED' },
      }),
      this.prisma.notificationLog.count({
        where: {
          createdAt: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalDocuments,
      expiringDocuments,
      expiredDocuments,
      todayNotifications,
    };
  }
}
