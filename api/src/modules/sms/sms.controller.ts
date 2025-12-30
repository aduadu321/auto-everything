import { Controller, Post, Get, Body, HttpCode } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendSmsDto, SendBulkSmsDto } from './dto/send-sms.dto';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @HttpCode(200)
  async sendSms(@Body() dto: SendSmsDto) {
    const result = await this.smsService.sendSms(dto.phone, dto.message, dto.senderId);
    return result;
  }

  @Post('send-bulk')
  @HttpCode(200)
  async sendBulkSms(@Body() dto: SendBulkSmsDto) {
    const results = await this.smsService.sendBulkSms(dto.messages, dto.senderId);
    return { results };
  }

  @Get('balance')
  async getBalance() {
    return this.smsService.getBalances();
  }
}
