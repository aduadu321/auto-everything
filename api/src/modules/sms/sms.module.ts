import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { TwilioService } from '../../providers/twilio/twilio.service';
import { SmsLinkService } from '../../providers/smslink/smslink.service';

@Module({
  imports: [ConfigModule],
  controllers: [SmsController],
  providers: [
    SmsService,
    TwilioService,
    SmsLinkService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
