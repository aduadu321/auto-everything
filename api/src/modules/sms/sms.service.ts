import { Injectable, Logger } from '@nestjs/common';
import { TwilioService } from '../../providers/twilio/twilio.service';
import { SmsLinkService } from '../../providers/smslink/smslink.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly twilio: TwilioService,
    private readonly smsLink: SmsLinkService,
  ) {}

  async sendSms(phone: string, message: string, senderId?: string) {
    this.logger.log(`Sending SMS to ${phone}`);

    // Use Twilio as primary provider
    const result = await this.twilio.sendSms(phone, message);

    if (result.success) {
      return { ...result, provider: 'twilio' };
    }

    // Fallback to SMSLink for Romanian numbers
    if (phone.startsWith('+40') || phone.startsWith('40') || phone.startsWith('07')) {
      this.logger.warn('Twilio failed, trying SMSLink...');
      const smsLinkResult = await this.smsLink.sendSms(phone, message, senderId);
      return { ...smsLinkResult, provider: 'smslink' };
    }

    return { ...result, provider: 'twilio' };
  }

  async sendBulkSms(messages: Array<{ phone: string; message: string }>, senderId?: string) {
    const results = [];

    for (const msg of messages) {
      const result = await this.sendSms(msg.phone, msg.message, senderId);
      results.push(result);
    }

    return results;
  }

  async getBalances() {
    const [twilioBalance, smsLinkBalance] = await Promise.allSettled([
      this.twilio.getBalance(),
      this.smsLink.getBalance(),
    ]);

    return {
      twilio: twilioBalance.status === 'fulfilled' ? twilioBalance.value : null,
      smslink: smsLinkBalance.status === 'fulfilled' ? smsLinkBalance.value : { credits: 0, currency: 'RON' },
    };
  }
}
