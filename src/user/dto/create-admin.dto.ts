import { IsEmail, IsNotEmpty, IsString, IsEnum, IsBoolean } from "class-validator";

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  confirm_password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsBoolean()
  isCreator: boolean;
}
