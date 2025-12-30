import { IsString, IsOptional, IsUUID, IsDateString, IsNumber, IsEnum } from 'class-validator';

export enum DocumentType {
  ITP = 'ITP',
  RCA = 'RCA',
  CASCO = 'CASCO',
  VIGNETTE = 'VIGNETTE',
  OTHER = 'OTHER',
}

export class CreateDocumentDto {
  @IsUUID()
  vehicleId: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  expiryDate: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  @IsOptional()
  issuedBy?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  // For Insurance
  @IsString()
  @IsOptional()
  insuranceType?: string;

  @IsString()
  @IsOptional()
  insuranceCompany?: string;

  // For Vignette
  @IsString()
  @IsOptional()
  vignetteType?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateDocumentDto {
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  @IsOptional()
  issuedBy?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  insuranceType?: string;

  @IsString()
  @IsOptional()
  insuranceCompany?: string;

  @IsString()
  @IsOptional()
  vignetteType?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class DocumentQueryDto {
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  expiringInDays?: number;
}
