import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min, Max, IsEmail } from 'class-validator';

export enum ServiceType {
  ITP = 'ITP',
  RCA = 'RCA',
  CASCO = 'CASCO',
  SERVICE = 'SERVICE',
  TIRE = 'TIRE',
  OTHER = 'OTHER',
}

export enum BusinessType {
  ITP_STATION = 'ITP_STATION',
  AUTO_SERVICE = 'AUTO_SERVICE',
  TIRE_SHOP = 'TIRE_SHOP',
  CAR_WASH = 'CAR_WASH',
  INSURANCE_BROKER = 'INSURANCE_BROKER',
  MULTI_SERVICE = 'MULTI_SERVICE',
}

export class SearchStationsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @IsOptional()
  @IsString()
  county?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  radius?: number; // km

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class CreateServiceRequestDto {
  @IsString()
  clientPhone: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsString()
  vehiclePlate: string;

  @IsOptional()
  @IsString()
  vehicleMake?: string;

  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @IsOptional()
  @IsNumber()
  vehicleYear?: number;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @IsOptional()
  @IsString()
  county?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxDistance?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOfferDto {
  @IsString()
  requestId: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsDateString()
  availableDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateReviewDto {
  @IsString()
  tenantId: string;

  @IsString()
  clientPhone: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  serviceType?: string;
}

// Response DTOs
export interface StationListItem {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  phone?: string;
  address?: string;
  city?: string;
  county?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  distance?: number;
}

export interface ServiceRequestResponse {
  id: string;
  clientPhone: string;
  vehiclePlate: string;
  serviceType: string;
  status: string;
  offersCount: number;
  createdAt: Date;
  expiresAt: Date;
}
