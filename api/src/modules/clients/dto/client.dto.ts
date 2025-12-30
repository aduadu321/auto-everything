import { IsString, IsEmail, IsOptional, IsBoolean, IsPhoneNumber } from 'class-validator';

export class CreateClientDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  county?: string;

  @IsBoolean()
  @IsOptional()
  preferSms?: boolean;

  @IsBoolean()
  @IsOptional()
  preferEmail?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  county?: string;

  @IsBoolean()
  @IsOptional()
  preferSms?: boolean;

  @IsBoolean()
  @IsOptional()
  preferEmail?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ClientQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
