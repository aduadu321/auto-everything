import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SendSmsDto {
  @IsString()
  phone: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  senderId?: string;
}

export class BulkSmsItemDto {
  @IsString()
  phone: string;

  @IsString()
  message: string;
}

export class SendBulkSmsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkSmsItemDto)
  messages: BulkSmsItemDto[];

  @IsOptional()
  @IsString()
  senderId?: string;
}
