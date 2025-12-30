import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Request() req: RequestWithUser) {
    return this.dashboardService.getStats(req.user.id);
  }

  @Get('chart')
  async getChartData(
    @Request() req: RequestWithUser,
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
  ) {
    return this.dashboardService.getChartData(req.user.id, period);
  }
}
