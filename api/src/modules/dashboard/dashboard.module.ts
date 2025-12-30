import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma.service';
import { PrismaMasterService } from '../../database/prisma-master.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService, PrismaMasterService],
  exports: [DashboardService],
})
export class DashboardModule {}
