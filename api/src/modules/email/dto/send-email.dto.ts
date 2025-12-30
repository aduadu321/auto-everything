import { IsString, IsEmail, IsOptional } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  html?: string;
}
