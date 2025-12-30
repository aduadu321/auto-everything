import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class AddToWaitlistDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  source?: string;
}

@ApiTags('Waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add email to waitlist' })
  @ApiResponse({ status: 200, description: 'Successfully added to waitlist' })
  async addToWaitlist(@Body() dto: AddToWaitlistDto) {
    return this.waitlistService.addToWaitlist(dto);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get waitlist count' })
  async getCount() {
    const count = await this.waitlistService.getWaitlistCount();
    return { count };
  }
}
