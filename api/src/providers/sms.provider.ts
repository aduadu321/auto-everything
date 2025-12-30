import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsLinkService } from './smslink/smslink.service';
import { SmsAdvertiserService } from './sms-advertiser/sms-advertiser.service';

export type SmsProvider = 'smslink' | 'smsadvertiser';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: SmsProvider;
}

/**
 * Unified SMS Provider - Supports multiple Romanian providers
 * with automatic fallback
 */
@Injectable()
export class SmsProviderService {
  private readonly logger = new Logger(SmsProviderService.name);
  private readonly primaryProvider: SmsProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly smsLink: SmsLinkService,
    private readonly smsAdvertiser: SmsAdvertiserService,
  ) {
    this.primaryProvider = this.config.get<SmsProvider>(
      'SMS_PRIMARY_PROVIDER',
      'smslink',
    );
  }

  /**
   * Send SMS with automatic fallback to backup provider
   */
  async send(
    phone: string,
    message: string,
    options?: {
      senderId?: string;
      provider?: SmsProvider;
      useFallback?: boolean;
    },
  ): Promise<SendResult> {
    const provider = options?.provider || this.primaryProvider;
    const useFallback = options?.useFallback ?? true;

    // Try primary provider
    let result = await this.sendViaProvider(provider, phone, message, options?.senderId);

    // If failed and fallback enabled, try backup provider
    if (!result.success && useFallback) {
      const backupProvider = provider === 'smslink' ? 'smsadvertiser' : 'smslink';
      this.logger.warn(`Primary provider ${provider} failed, trying ${backupProvider}`);

      result = await this.sendViaProvider(backupProvider, phone, message, options?.senderId);
    }

    return result;
  }

  /**
   * Send bulk SMS
   */
  async sendBulk(
    messages: Array<{ phone: string; message: string }>,
    options?: {
      senderId?: string;
      provider?: SmsProvider;
    },
  ): Promise<SendResult[]> {
    const results: SendResult[] = [];

    for (const msg of messages) {
      const result = await this.send(msg.phone, msg.message, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Get balance from all providers
   */
  async getAllBalances(): Promise<Record<SmsProvider, { credits: number; currency: string }>> {
    const [smsLinkBalance, smsAdvertiserBalance] = await Promise.allSettled([
      this.smsLink.getBalance(),
      this.smsAdvertiser.getBalance(),
    ]);

    return {
      smslink:
        smsLinkBalance.status === 'fulfilled'
          ? smsLinkBalance.value
          : { credits: 0, currency: 'RON' },
      smsadvertiser:
        smsAdvertiserBalance.status === 'fulfilled'
          ? smsAdvertiserBalance.value
          : { credits: 0, currency: 'RON' },
    };
  }

  private async sendViaProvider(
    provider: SmsProvider,
    phone: string,
    message: string,
    senderId?: string,
  ): Promise<SendResult> {
    try {
      let result;

      switch (provider) {
        case 'smslink':
          result = await this.smsLink.sendSms(phone, message, senderId);
          break;
        case 'smsadvertiser':
          result = await this.smsAdvertiser.sendSms(phone, message, senderId);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      return {
        ...result,
        provider,
      };
    } catch (error: any) {
      this.logger.error(`Provider ${provider} error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider,
      };
    }
  }
}
