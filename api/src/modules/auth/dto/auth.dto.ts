import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email invalid' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Parola trebuie să aibă minim 6 caractere' })
  password: string;
}

export enum BusinessType {
  ITP_STATION = 'ITP_STATION',
  AUTO_SERVICE = 'AUTO_SERVICE',
  TIRE_SHOP = 'TIRE_SHOP',
  CAR_WASH = 'CAR_WASH',
  INSURANCE_BROKER = 'INSURANCE_BROKER',
  MULTI_SERVICE = 'MULTI_SERVICE',
}

export class RegisterDto {
  @IsEmail({}, { message: 'Email invalid' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Parola trebuie să aibă minim 8 caractere' })
  password: string;

  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  businessName: string;

  @IsEnum(BusinessType, { message: 'Tip de afacere invalid' })
  businessType: BusinessType;

  @IsString()
  county: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
}
