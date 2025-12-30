import { IsString, IsOptional, IsBoolean, IsInt, IsEnum } from 'class-validator';

export enum DocumentType {
  ITP = 'ITP',
  RCA = 'RCA',
  CASCO = 'CASCO',
  VIGNETTE = 'VIGNETTE',
  OTHER = 'OTHER',
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsInt()
  triggerDays: number; // Days before expiry (30, 14, 7, 3, 1, 0, -1 for expired)

  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @IsString()
  @IsOptional()
  smsContent?: string;

  @IsString()
  @IsOptional()
  emailSubject?: string;

  @IsString()
  @IsOptional()
  emailContent?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  triggerDays?: number;

  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @IsString()
  @IsOptional()
  smsContent?: string;

  @IsString()
  @IsOptional()
  emailSubject?: string;

  @IsString()
  @IsOptional()
  emailContent?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

// Available variables for templates
export const TEMPLATE_VARIABLES = [
  { key: '{{client_name}}', description: 'Numele complet al clientului', example: 'Ion Popescu' },
  { key: '{{client_first_name}}', description: 'Prenumele clientului', example: 'Ion' },
  { key: '{{client_last_name}}', description: 'Numele de familie', example: 'Popescu' },
  { key: '{{client_phone}}', description: 'Telefonul clientului', example: '+40756123456' },
  { key: '{{vehicle_plate}}', description: 'Număr înmatriculare', example: 'B 123 ABC' },
  { key: '{{vehicle_make}}', description: 'Marca vehiculului', example: 'Dacia' },
  { key: '{{vehicle_model}}', description: 'Modelul vehiculului', example: 'Logan' },
  { key: '{{vehicle_year}}', description: 'Anul fabricației', example: '2020' },
  { key: '{{document_type}}', description: 'Tipul documentului', example: 'ITP' },
  { key: '{{expiry_date}}', description: 'Data expirării', example: '15.01.2025' },
  { key: '{{days_remaining}}', description: 'Zile rămase', example: '7' },
  { key: '{{company_name}}', description: 'Numele firmei tale', example: 'Auto Service SRL' },
  { key: '{{company_phone}}', description: 'Telefonul firmei', example: '0741234567' },
];
