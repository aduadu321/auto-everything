import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { SmsCreditsService } from './sms-credits.service';
import { TwilioService } from '../../providers/twilio/twilio.service';
import { SmsLinkService } from '../../providers/smslink/smslink.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [SmsController],
  providers: [
    SmsService,
    SmsCreditsService,
    TwilioService,
    SmsLinkService,
    PrismaService,
  ],
  exports: [SmsService, SmsCreditsService],
})
export class SmsModule {}
