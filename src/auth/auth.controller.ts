import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  Param,
  UseGuards,
  ValidationPipe,
  Put,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../user/dto/create-user.dto";
import { SigninUserDto } from "../user/dto/signIn-user.dto";
import { Request, Response } from "express";
import { CustomJwtGuard } from "../common/guards/jwt.guard";
import { UpdateUserDto } from "../user/dto/update-user.dto";
import { UpdateMeDto } from "../user/dto/update-me.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  @Post("signin")
  async signin(
    @Body(ValidationPipe) signinUserDto: SigninUserDto,
    @Res() res: Response
  ) {
    const result = await this.authService.signin(signinUserDto, res);
    res.json(result);
  }
  @UseGuards(CustomJwtGuard)
  @Get("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.refresh(req, res);
  }
  @UseGuards(CustomJwtGuard)
  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return this.authService.logout(res, req);
  }

  @Get("activate/:link")
  async activate(@Param("link") activationLink: string) {
    return this.authService.activate(activationLink);
  }

  @UseGuards(CustomJwtGuard)
  @Get("me")
  async me(@Req() req: Request) {
    return await this.authService.me(req);
  }
  @UseGuards(CustomJwtGuard)
  @Put("me")
  async UpdateMe(@Req() req: Request, @Body() updateUserDto: UpdateMeDto) {
    return await this.authService.UpdateMe(req, updateUserDto);
  }
  @Post("forgot")
  async forgot_password(@Body() data: ResetPasswordDto) {
    return await this.authService.resetPassword(undefined, undefined, data.email);
  }
  @UseGuards(CustomJwtGuard)
  @Put("reset")
  async reset_password(@Body() data: ResetPasswordDto, @Req() req: Request) {
    return await this.authService.resetPassword(req, data);
  }
  @Put("confirm_new")
  async confirm_reset(
    @Body("code") id : string,
    @Body("password") password: string,
    @Body("confirmPassword") confirmPassword: string
  ) {
    return await this.authService.confirm_reset(id, password, confirmPassword);
  }
}
