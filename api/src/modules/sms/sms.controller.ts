import { Controller, Post, Get, Body, HttpCode, UseGuards, Req } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsCreditsService } from './sms-credits.service';
import { SendSmsDto, SendBulkSmsDto } from './dto/send-sms.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sms')
@UseGuards(JwtAuthGuard)
export class SmsController {
  constructor(
    private readonly smsService: SmsService,
    private readonly creditsService: SmsCreditsService,
  ) {}

  @Post('send')
  @HttpCode(200)
  async sendSms(@Body() dto: SendSmsDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';

    // Check credits before sending
    const hasCredits = await this.creditsService.hasCredits(tenantId, 1);
    if (!hasCredits) {
      return {
        success: false,
        error: 'Insufficient SMS credits. Please purchase more credits.',
      };
    }

    const result = await this.smsService.sendSms(dto.phone, dto.message, dto.senderId);

    // Deduct credits and log usage on success
    if (result.success) {
      await this.creditsService.deductCredits(tenantId, 1);
      await this.creditsService.logUsage({
        tenantId,
        phone: dto.phone,
        messageType: 'single',
        provider: (result as any).provider || 'unknown',
        success: true,
      });
    }

    return result;
  }

  @Post('send-bulk')
  @HttpCode(200)
  async sendBulkSms(@Body() dto: SendBulkSmsDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';
    const messageCount = dto.messages.length;

    // Check credits before sending
    const hasCredits = await this.creditsService.hasCredits(tenantId, messageCount);
    if (!hasCredits) {
      return {
        success: false,
        error: `Insufficient SMS credits. Need ${messageCount} credits.`,
        results: [],
      };
    }

    const results = await this.smsService.sendBulkSms(dto.messages, dto.senderId);

    // Count successful sends and deduct credits
    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      await this.creditsService.deductCredits(tenantId, successCount);
    }

    return {
      success: true,
      sent: successCount,
      failed: messageCount - successCount,
      results,
    };
  }

  @Get('balance')
  async getBalance() {
    return this.smsService.getBalances();
  }

  @Get('credits')
  async getCredits(@Req() req: any) {
    const tenantId = req.user?.tenantId || 'default';
    const credits = await this.creditsService.getCredits(tenantId);

    return {
      credits,
      packages: [
        { id: 'sms_100', name: '100 SMS', credits: 100, price: 25, currency: 'RON' },
        { id: 'sms_500', name: '500 SMS', credits: 500, price: 100, currency: 'RON' },
        { id: 'sms_1000', name: '1000 SMS', credits: 1000, price: 175, currency: 'RON' },
        { id: 'sms_5000', name: '5000 SMS', credits: 5000, price: 750, currency: 'RON' },
      ],
    };
  }
}
