import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService, PrismaService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
