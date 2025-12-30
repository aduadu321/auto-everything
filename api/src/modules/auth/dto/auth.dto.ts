import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email invalid' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Parola trebuie să aibă minim 6 caractere' })
  password: string;
}

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}
