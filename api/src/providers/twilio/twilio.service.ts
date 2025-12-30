import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly client: Twilio.Twilio;
  private readonly fromNumber: string;

  constructor(private readonly config: ConfigService) {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID', '');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN', '');
    this.fromNumber = this.config.get<string>('TWILIO_PHONE_NUMBER', '');

    this.client = Twilio.default(accountSid, authToken);
  }

  /**
   * Send SMS via Twilio
   */
  async sendSms(
    phone: string,
    message: string,
    fromNumber?: string,
  ): Promise<SendSmsResult> {
    try {
      const result = await this.client.messages.create({
        body: message,
        to: this.formatPhone(phone),
        from: fromNumber || this.fromNumber,
      });

      this.logger.log(`SMS sent via Twilio: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error: any) {
      this.logger.error(`Twilio error: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSms(
    messages: Array<{ phone: string; message: string }>,
  ): Promise<SendSmsResult[]> {
    const results: SendSmsResult[] = [];

    for (const msg of messages) {
      const result = await this.sendSms(msg.phone, msg.message);
      results.push(result);
    }

    return results;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{ credits: number; currency: string }> {
    try {
      const balance = await this.client.balance.fetch();

      return {
        credits: parseFloat(balance.balance),
        currency: balance.currency,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get Twilio balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check message status
   */
  async getMessageStatus(messageId: string): Promise<{
    status: string;
    deliveredAt?: Date;
  }> {
    try {
      const message = await this.client.messages(messageId).fetch();

      return {
        status: message.status,
        deliveredAt: message.dateUpdated,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get message status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format phone to E.164 format
   */
  private formatPhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    // Romanian number
    if (cleaned.startsWith('07') && cleaned.length === 10) {
      cleaned = '40' + cleaned.substring(1);
    }

    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }
}
