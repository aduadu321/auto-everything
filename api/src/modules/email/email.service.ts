import { Injectable, Logger } from '@nestjs/common';
import { SendGridService } from '../../providers/sendgrid/sendgrid.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly sendgrid: SendGridService) {}

  async sendEmail(to: string, subject: string, body: string, html?: string) {
    this.logger.log(`Sending email to ${to}`);

    const htmlContent = html || `<p>${body.replace(/\n/g, '<br>')}</p>`;

    const result = await this.sendgrid.sendEmail(to, subject, htmlContent, body);

    return {
      ...result,
      provider: 'sendgrid',
    };
  }

  async sendBulkEmails(
    emails: Array<{ to: string; subject: string; body: string }>,
  ) {
    const results = [];

    for (const email of emails) {
      const result = await this.sendEmail(email.to, email.subject, email.body);
      results.push(result);
    }

    return results;
  }
}
