import { IsEmail, IsOptional } from "class-validator";

export class ResetPasswordDto {
  @IsEmail()
  @IsOptional()
  email?: string;
  oldPassword?: string;
  newPassword: string;
  confirmPassword: string;
}
