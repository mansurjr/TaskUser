import { IsEmail } from "class-validator";

export class UpdateMeDto {
  @IsEmail()
  email?: string;
  full_name?: string;
}