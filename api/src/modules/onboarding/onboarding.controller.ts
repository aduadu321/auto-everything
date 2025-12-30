import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { OnboardingService, OnboardingData } from './onboarding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ScheduleDayDto {
  @IsNumber()
  dayOfWeek: number;

  @IsBoolean()
  isOpen: boolean;

  @IsString()
  openTime: string;

  @IsString()
  closeTime: string;
}

class NotificationSettingsDto {
  @IsBoolean()
  enableSms: boolean;

  @IsBoolean()
  enableEmail: boolean;

  @IsArray()
  @IsNumber({}, { each: true })
  reminderDays: number[];

  @IsString()
  sendTime: string;
}

class SmsGatewaySettingsDto {
  @IsBoolean()
  useOwnGateway: boolean;

  @IsBoolean()
  deviceConnected: boolean;
}

class CompleteOnboardingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  schedule: ScheduleDayDto[];

  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications: NotificationSettingsDto;

  @ValidateNested()
  @Type(() => SmsGatewaySettingsDto)
  smsGateway: SmsGatewaySettingsDto;
}

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete tenant onboarding' })
  @ApiResponse({ status: 200, description: 'Onboarding completed successfully' })
  async completeOnboarding(
    @Req() req: Request,
    @Body() dto: CompleteOnboardingDto,
  ) {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant not found in request');
    }

    return this.onboardingService.completeOnboarding(tenantId, dto as OnboardingData);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get onboarding status' })
  async getStatus(@Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant not found in request');
    }

    return this.onboardingService.getOnboardingStatus(tenantId);
  }
}
