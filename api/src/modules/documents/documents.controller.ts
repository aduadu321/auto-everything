import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, DocumentQueryDto } from './dto/document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get()
  findAll(@Query() query: DocumentQueryDto) {
    return this.documentsService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.documentsService.getStats();
  }

  @Get('expiring')
  findExpiring(@Query('days') days?: string) {
    return this.documentsService.findExpiring(days ? parseInt(days) : 30);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Put(':id/renew')
  renew(@Param('id') id: string, @Body('expiryDate') expiryDate: string) {
    return this.documentsService.renew(id, expiryDate);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @Post('update-statuses')
  updateStatuses() {
    return this.documentsService.updateStatuses();
  }
}
