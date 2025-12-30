import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @HttpCode(200)
  async sendEmail(@Body() dto: SendEmailDto) {
    const result = await this.emailService.sendEmail(
      dto.to,
      dto.subject,
      dto.body,
      dto.html,
    );
    return result;
  }
}
