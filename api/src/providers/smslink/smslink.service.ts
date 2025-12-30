import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

/**
 * SMSLink.ro - Romania's #1 SMS Provider
 * Documentation: https://www.smslink.ro/content/api-documentatie-sms-gateway.html
 */
@Injectable()
export class SmsLinkService {
  private readonly logger = new Logger(SmsLinkService.name);
  private readonly client: AxiosInstance;
  private readonly connectionId: string;
  private readonly password: string;

  constructor(private readonly config: ConfigService) {
    this.connectionId = this.config.get<string>('SMSLINK_CONNECTION_ID', '');
    this.password = this.config.get<string>('SMSLINK_PASSWORD', '');

    this.client = axios.create({
      baseURL: 'https://www.smslink.ro/sms/gateway/communicate',
      timeout: 30000,
    });
  }

  /**
   * Send a single SMS via SMSLink
   */
  async sendSms(
    phone: string,
    message: string,
    senderId?: string,
  ): Promise<SendSmsResult> {
    try {
      const params = new URLSearchParams({
        connection_id: this.connectionId,
        password: this.password,
        to: this.formatPhone(phone),
        message: message,
        ...(senderId && { sender_id: senderId }),
      });

      const response = await this.client.post('/json.php', params);

      if (response.data.status === 'success' || response.data.message_id) {
        this.logger.log(`SMS sent to ${phone} via SMSLink`);
        return {
          success: true,
          messageId: response.data.message_id?.toString(),
          cost: response.data.cost,
        };
      }

      return {
        success: false,
        error: response.data.error || 'Unknown error',
      };
    } catch (error: any) {
      this.logger.error(`SMSLink error: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Send bulk SMS (up to 200 per request)
   */
  async sendBulkSms(
    messages: Array<{ phone: string; message: string }>,
    senderId?: string,
  ): Promise<SendSmsResult[]> {
    // SMSLink supports batch sending
    const results: SendSmsResult[] = [];

    for (const msg of messages) {
      const result = await this.sendSms(msg.phone, msg.message, senderId);
      results.push(result);

      // Rate limiting - 10 SMS/second max
      await this.delay(100);
    }

    return results;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{ credits: number; currency: string }> {
    try {
      const params = new URLSearchParams({
        connection_id: this.connectionId,
        password: this.password,
      });

      const response = await this.client.post('/balance/json.php', params);

      return {
        credits: parseFloat(response.data.balance || '0'),
        currency: 'RON',
      };
    } catch (error: any) {
      this.logger.error(`Failed to get SMSLink balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check delivery status
   */
  async getDeliveryStatus(messageId: string): Promise<{
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    deliveredAt?: Date;
  }> {
    try {
      const params = new URLSearchParams({
        connection_id: this.connectionId,
        password: this.password,
        message_id: messageId,
      });

      const response = await this.client.post('/report/json.php', params);

      const statusMap: Record<string, 'pending' | 'sent' | 'delivered' | 'failed'> = {
        '1': 'pending',
        '2': 'sent',
        '3': 'delivered',
        '4': 'failed',
      };

      return {
        status: statusMap[response.data.status] || 'pending',
        deliveredAt: response.data.delivered_at
          ? new Date(response.data.delivered_at)
          : undefined,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format Romanian phone number
   */
  private formatPhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    // Convert 07xx to +407xx
    if (cleaned.startsWith('07') && cleaned.length === 10) {
      cleaned = '40' + cleaned.substring(1);
    }

    // Convert 007xx to 407xx
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    }

    return cleaned;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
