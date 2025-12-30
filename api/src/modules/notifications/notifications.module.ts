import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { PrismaService } from '../../database/prisma.service';
import { SmsModule } from '../sms/sms.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [SmsModule, EmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsScheduler, PrismaService],
  exports: [NotificationsService, NotificationsScheduler],
})
export class NotificationsModule {}
