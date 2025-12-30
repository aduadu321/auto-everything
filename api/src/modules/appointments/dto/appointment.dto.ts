import { IsString, IsOptional, IsEnum, IsDateString, IsInt, IsBoolean, Min, Max, IsArray } from 'class-validator';

export enum VehicleCategory {
  AUTOTURISM = 'AUTOTURISM',
  AUTOUTILITARA = 'AUTOUTILITARA',
  MOTOCICLETA = 'MOTOCICLETA',
  REMORCA = 'REMORCA',
  ATV = 'ATV',
}

export enum ServiceType {
  ITP = 'ITP',
  ITP_REINSPECTIE = 'ITP_REINSPECTIE',
  DIAGNOSTIC = 'DIAGNOSTIC',
  OIL_CHANGE = 'OIL_CHANGE',
  BRAKE_SERVICE = 'BRAKE_SERVICE',
  TIRE_SERVICE = 'TIRE_SERVICE',
  AC_SERVICE = 'AC_SERVICE',
  GENERAL_SERVICE = 'GENERAL_SERVICE',
  CONSULTATION = 'CONSULTATION',
  OTHER = 'OTHER',
}

export enum ItpResult {
  ADMIS = 'ADMIS',
  RESPINS = 'RESPINS',
  ADMIS_OBS = 'ADMIS_OBS',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  RAR_BLOCKED = 'RAR_BLOCKED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export class CreateAppointmentDto {
  @IsString()
  clientName: string;

  @IsString()
  clientPhone: string;

  @IsOptional()
  @IsString()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  vehicleMake?: string;

  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @IsOptional()
  @IsInt()
  vehicleYear?: number;

  @IsOptional()
  @IsEnum(VehicleCategory)
  vehicleCategory?: VehicleCategory;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsOptional()
  @IsString()
  serviceNotes?: string;

  @IsDateString()
  appointmentDate: string;

  @IsString()
  startTime: string; // HH:MM format

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  duration?: number;

  @IsOptional()
  @IsString()
  clientId?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  vehicleMake?: string;

  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsString()
  serviceNotes?: string;

  @IsOptional()
  @IsDateString()
  appointmentDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class AppointmentQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}

export class GetSlotsDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsInt()
  duration?: number;
}

export class WorkingHoursDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsBoolean()
  isOpen: boolean;

  @IsOptional()
  @IsString()
  openTime?: string;

  @IsOptional()
  @IsString()
  closeTime?: string;

  @IsOptional()
  @IsString()
  breakStart?: string;

  @IsOptional()
  @IsString()
  breakEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  slotDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAppointments?: number;
}

export class UpdateWorkingHoursDto {
  @IsArray()
  workingHours: WorkingHoursDto[];
}

export class CreateHolidayDto {
  @IsString()
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsBoolean()
  isOrthodox?: boolean;
}

export class RarBlockDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ItpResultDto {
  @IsEnum(ItpResult)
  result: ItpResult;

  @IsOptional()
  @IsString()
  notes?: string;
}
