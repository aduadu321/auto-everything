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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  findAll(@Query('clientId') clientId?: string) {
    return this.vehiclesService.findAll(clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
