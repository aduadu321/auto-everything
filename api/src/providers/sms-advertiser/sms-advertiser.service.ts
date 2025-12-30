import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  credits?: number;
}

export interface SmsBalance {
  credits: number;
  currency: string;
}

@Injectable()
export class SmsAdvertiserService {
  private readonly logger = new Logger(SmsAdvertiserService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('SMS_ADVERTISER_API_KEY', '');

    this.client = axios.create({
      baseURL: this.config.get<string>(
        'SMS_ADVERTISER_API_URL',
        'https://www.smsadvert.ro/api',
      ),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Send a single SMS message
   */
  async sendSms(
    phone: string,
    message: string,
    senderId?: string,
  ): Promise<SendSmsResult> {
    try {
      const response = await this.client.post('/sms/send', {
        to: this.formatPhone(phone),
        message,
        from: senderId || 'SMSNotify',
      });

      this.logger.log(`SMS sent to ${phone}: ${response.data.messageId}`);

      return {
        success: true,
        messageId: response.data.messageId,
        credits: response.data.credits,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send SMS to ${phone}: ${error.message}`);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSms(
    messages: Array<{ phone: string; message: string }>,
    senderId?: string,
  ): Promise<SendSmsResult[]> {
    const results = await Promise.all(
      messages.map((msg) => this.sendSms(msg.phone, msg.message, senderId)),
    );
    return results;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<SmsBalance> {
    try {
      const response = await this.client.get('/account/balance');
      return {
        credits: response.data.credits || response.data.balance,
        currency: response.data.currency || 'RON',
      };
    } catch (error: any) {
      this.logger.error(`Failed to get balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check delivery status
   */
  async getDeliveryStatus(
    messageId: string,
  ): Promise<{ status: string; deliveredAt?: Date }> {
    try {
      const response = await this.client.get(`/sms/status/${messageId}`);
      return {
        status: response.data.status,
        deliveredAt: response.data.deliveredAt
          ? new Date(response.data.deliveredAt)
          : undefined,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get status for ${messageId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format phone number to international format
   */
  private formatPhone(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // Handle Romanian numbers
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '40' + cleaned.substring(1);
    }

    // Ensure + prefix
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }
}
