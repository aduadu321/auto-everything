import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { HolidaysService } from './holidays.service';

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (startDate && endDate) {
      return this.holidaysService.findByDateRange(
        new Date(startDate),
        new Date(endDate),
      );
    }
    return this.holidaysService.findAll();
  }

  @Post()
  async create(
    @Body() body: { name: string; date: string; isRecurring?: boolean },
  ) {
    return this.holidaysService.create({
      name: body.name,
      date: new Date(body.date),
      isRecurring: body.isRecurring,
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.holidaysService.delete(id);
  }

  @Delete('by-date/:date')
  async deleteByDate(@Param('date') date: string) {
    return this.holidaysService.deleteByDate(date);
  }
}
