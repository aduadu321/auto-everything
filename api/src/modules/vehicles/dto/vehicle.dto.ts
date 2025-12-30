import { IsString, IsOptional, IsInt, IsUUID } from 'class-validator';

export class CreateVehicleDto {
  @IsUUID()
  clientId: string;

  @IsString()
  plateNumber: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  engineType?: string;

  @IsInt()
  @IsOptional()
  engineCapacity?: number;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  engineType?: string;

  @IsInt()
  @IsOptional()
  engineCapacity?: number;

  @IsString()
  @IsOptional()
  color?: string;
}
