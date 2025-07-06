import { IsEmail, IsNotEmpty, IsString, IsEnum } from "class-validator";
import { role } from "@prisma/client";

export class CreateUserDto {
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

  isCreator = false;
}
