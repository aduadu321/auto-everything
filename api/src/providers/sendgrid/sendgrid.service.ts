import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY', '');
    this.fromEmail = this.config.get<string>('SENDGRID_FROM_EMAIL', 'noreply@example.com');

    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid initialized');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<SendEmailResult> {
    try {
      const msg = {
        to,
        from: this.fromEmail,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''),
        html,
      };

      const [response] = await sgMail.send(msg);

      this.logger.log(`Email sent to ${to}`);

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
      };
    } catch (error: any) {
      this.logger.error(`SendGrid error: ${error.message}`);

      return {
        success: false,
        error: error.response?.body?.errors?.[0]?.message || error.message,
      };
    }
  }

  async sendBulkEmails(
    emails: Array<{ to: string; subject: string; html: string }>,
  ): Promise<SendEmailResult[]> {
    const results: SendEmailResult[] = [];

    for (const email of emails) {
      const result = await this.sendEmail(email.to, email.subject, email.html);
      results.push(result);
    }

    return results;
  }
}
