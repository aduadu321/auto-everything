import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsScheduler: NotificationsScheduler,
  ) {}

  // ============================================
  // TEMPLATES
  // ============================================

  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.notificationsService.createTemplate(dto);
  }

  @Get('templates')
  findAllTemplates(@Query('type') type?: string) {
    return this.notificationsService.findAllTemplates(type);
  }

  @Get('templates/variables')
  getTemplateVariables() {
    return this.notificationsService.getTemplateVariables();
  }

  @Get('templates/:id')
  findTemplate(@Param('id') id: string) {
    return this.notificationsService.findTemplate(id);
  }

  @Put('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.notificationsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.notificationsService.deleteTemplate(id);
  }

  @Post('templates/seed-defaults')
  seedDefaultTemplates() {
    return this.notificationsService.seedDefaultTemplates();
  }

  // ============================================
  // SEND NOTIFICATIONS
  // ============================================

  @Post('send')
  sendNotification(
    @Body() body: { documentId: string; channel: 'SMS' | 'EMAIL'; templateId?: string }
  ) {
    return this.notificationsService.sendNotification(
      body.documentId,
      body.channel,
      body.templateId
    );
  }

  // ============================================
  // LOGS
  // ============================================

  @Get('logs')
  getNotificationLogs(
    @Query('clientId') clientId?: string,
    @Query('documentId') documentId?: string,
    @Query('channel') channel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getNotificationLogs({
      clientId,
      documentId,
      channel,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // ============================================
  // SCHEDULER / AUTOMATION
  // ============================================

  @Post('scheduler/run')
  runManualCheck() {
    return this.notificationsScheduler.runManualCheck();
  }

  @Get('scheduler/stats')
  getSchedulerStats() {
    return this.notificationsScheduler.getSchedulerStats();
  }
}
