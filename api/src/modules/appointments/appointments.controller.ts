import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
  WorkingHoursDto,
  UpdateWorkingHoursDto,
  CreateHolidayDto,
  RarBlockDto,
  ItpResultDto,
} from './dto/appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ==================== APPOINTMENTS ====================

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  findAll(@Query() query: AppointmentQueryDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.appointmentsService.getStats();
  }

  @Get('calendar')
  getCalendarData(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.appointmentsService.getCalendarData(m, y);
  }

  @Get('slots')
  getAvailableSlots(
    @Query('date') date: string,
    @Query('duration') duration?: string,
  ) {
    return this.appointmentsService.getAvailableSlots(
      date,
      duration ? parseInt(duration, 10) : 60,
    );
  }

  @Get('confirmation/:code')
  findByConfirmationCode(@Param('code') code: string) {
    return this.appointmentsService.findByConfirmationCode(code);
  }


  @Get('by-phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    return this.appointmentsService.findByPhone(phone);
  }

  @Get('by-plate/:plate')
  findByPlate(@Param('plate') plate: string) {
    return this.appointmentsService.findByPlate(plate);
  }

  @Get('search/:query')
  searchUnified(@Param('query') query: string) {
    return this.appointmentsService.searchUnified(query);
  }

  @Get('check-itp/:plate')
  checkItpExpiry(@Param('plate') plate: string) {
    return this.appointmentsService.checkItpExpiry(plate);
  }
@Get("itp-status")
  getAllItpStatus() {
    return this.appointmentsService.getAllItpStatus();
  }

  // ==================== APPROVAL VIA EMAIL LINK ====================

  @Get("approve/:token")

  async approveByToken(@Param('token') token: string, @Res() res: Response) {
    try {
      const result = await this.appointmentsService.approveByToken(token);
      return res.status(HttpStatus.OK).send(this.generateApprovalResponseHtml(
        result.alreadyProcessed ? 'info' : 'success',
        result.alreadyProcessed ? 'Programare deja procesată' : 'Programare Acceptată!',
        result.message,
      ));
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).send(this.generateApprovalResponseHtml(
        'error',
        'Eroare',
        error.message || 'Link-ul nu este valid.',
      ));
    }
  }

  @Get('reject/:token')
  async rejectByToken(@Param('token') token: string, @Res() res: Response) {
    try {
      const result = await this.appointmentsService.rejectByToken(token);
      return res.status(HttpStatus.OK).send(this.generateApprovalResponseHtml(
        result.alreadyProcessed ? 'info' : 'warning',
        result.alreadyProcessed ? 'Programare deja procesată' : 'Programare Refuzată',
        result.message,
      ));
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).send(this.generateApprovalResponseHtml(
        'error',
        'Eroare',
        error.message || 'Link-ul nu este valid.',
      ));
    }
  }

  private generateApprovalResponseHtml(type: 'success' | 'warning' | 'error' | 'info', title: string, message: string): string {
    const colors = {
      success: { bg: '#dcfce7', border: '#16a34a', icon: '✅' },
      warning: { bg: '#fef3c7', border: '#d97706', icon: '⚠️' },
      error: { bg: '#fee2e2', border: '#dc2626', icon: '❌' },
      info: { bg: '#dbeafe', border: '#2563eb', icon: 'ℹ️' },
    };
    const color = colors[type];

    return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - MISEDA INSPECT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 450px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: ${color.bg};
      border-bottom: 3px solid ${color.border};
      padding: 30px;
      text-align: center;
    }
    .icon { font-size: 48px; margin-bottom: 15px; }
    .title { font-size: 24px; font-weight: bold; color: #1f2937; }
    .content {
      padding: 30px;
      text-align: center;
    }
    .message {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 25px;
    }
    .btn {
      display: inline-block;
      background: #1e40af;
      color: white;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn:hover { background: #1e3a8a; }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon">${color.icon}</div>
      <div class="title">${title}</div>
    </div>
    <div class="content">
      <p class="message">${message}</p>
      <a href="https://misedainspectsrl.ro" class="btn">Înapoi la Site</a>
    </div>
    <div class="footer">
      MISEDA INSPECT SRL - Stație ITP Autorizată RAR<br>
      Strada Izvoarelor 5, Rădăuți 725400
    </div>
  </div>
</body>
</html>
    `;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Put(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.appointmentsService.confirm(id);
  }

  @Put(':id/cancel')
  cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.appointmentsService.cancel(id, reason);
  }

  @Put(':id/complete')
  complete(@Param('id') id: string) {
    return this.appointmentsService.complete(id);
  }

  @Put(':id/no-show')
  noShow(@Param('id') id: string) {
    return this.appointmentsService.noShow(id);
  }

  // ==================== ITP SPECIFIC ====================

  @Put(':id/start')
  startInspection(@Param('id') id: string) {
    return this.appointmentsService.startInspection(id);
  }

  @Put(':id/rar-block')
  markRarBlocked(@Param('id') id: string, @Body() dto: RarBlockDto) {
    return this.appointmentsService.markRarBlocked(id, dto.notes);
  }

  @Put(':id/itp-result')
  setItpResult(@Param('id') id: string, @Body() dto: ItpResultDto) {
    return this.appointmentsService.setItpResult(id, dto.result, dto.notes);
  }

  @Put(':id/quick-admis')
  quickAdmis(@Param('id') id: string, @Body('notes') notes?: string) {
    return this.appointmentsService.quickAdmis(id, notes);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  // ==================== WORKING HOURS ====================

  @Get('settings/working-hours')
  getWorkingHours() {
    return this.appointmentsService.getWorkingHours();
  }

  @Put('settings/working-hours')
  updateWorkingHours(@Body() dto: WorkingHoursDto) {
    return this.appointmentsService.updateWorkingHours(dto);
  }

  @Put('settings/working-hours/bulk')
  updateAllWorkingHours(@Body() dto: UpdateWorkingHoursDto) {
    return this.appointmentsService.updateAllWorkingHours(dto.workingHours);
  }

  @Post('settings/working-hours/seed')
  seedDefaultWorkingHours() {
    return this.appointmentsService.seedDefaultWorkingHours();
  }

  // ==================== HOLIDAYS ====================

  @Get('settings/holidays')
  getHolidays(@Query('year') year?: string) {
    return this.appointmentsService.getHolidays(year ? parseInt(year, 10) : undefined);
  }

  @Post('settings/holidays')
  createHoliday(@Body() dto: CreateHolidayDto) {
    return this.appointmentsService.createHoliday(dto);
  }

  @Delete('settings/holidays/:id')
  deleteHoliday(@Param('id') id: string) {
    return this.appointmentsService.deleteHoliday(id);
  }

  @Post('settings/holidays/seed-romanian')
  seedRomanianHolidays(@Query('year') year?: string) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.appointmentsService.seedRomanianHolidays(y);
  }
}
