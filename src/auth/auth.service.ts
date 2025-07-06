import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import { User } from "@prisma/client";
import { CreateUserDto } from "../user/dto/create-user.dto";
import { SigninUserDto } from "../user/dto/signIn-user.dto";
import { UserService } from "../user/user.service";
import { MailService } from "./mail.service";
import { UpdateUserDto } from "../user/dto/update-user.dto";
import { PrismaService } from "../prisma/prisma.service";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import * as otpGenerator from "otp-generator";
import { hash } from "crypto";

interface JwtOptions {
  access: { secret: string; expiresIn: string };
  refresh: { secret: string; expiresIn: string };
}

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
  isCreator: boolean;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UserService,
    private readonly mailService: MailService,
    private readonly prismaService: PrismaService
  ) {}

  private getJwtOptions(): JwtOptions {
    return {
      access: {
        secret: this.configService.get<string>("JWT_ACCESS")!,
        expiresIn: this.configService.get<string>("JWT_ACCESS_TIME")!,
      },
      refresh: {
        secret: this.configService.get<string>("JWT_REFRESH")!,
        expiresIn: this.configService.get<string>(`JWT_REFRESH_TIME`)!,
      },
    };
  }

  private async generateTokens(user: User): Promise<TokenResponse> {
    const { access, refresh } = this.getJwtOptions();
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive ?? false,
      isCreator: user?.isCreator ?? false,
    };
    console.log(access, refresh);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: access.secret,
        expiresIn: access.expiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refresh.secret,
        expiresIn: refresh.expiresIn,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async signup(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email
    );
    if (existingUser) {
      throw new ConflictException("Email already registered");
    }
    const { user } = await this.usersService.createUser(createUserDto);
    try {
      await this.mailService.sendMail(user);
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new ServiceUnavailableException(
        "Failed to send confirmation email"
      );
    }

    return {
      message:
        "Successfully registered. Please activate your account via link sent to your email.",
    };
  }

  async signin(
    signinUserDto: SigninUserDto,
    res: Response
  ): Promise<{ message: string; userId: number; accessToken: string }> {
    const user = await this.usersService.findByEmail(signinUserDto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }
    console.log(1);
    const isPasswordValid = await bcrypt.compare(
      signinUserDto.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const { accessToken, refreshToken } = await this.generateTokens(user);
    console.log(accessToken, refreshToken);

    await this.usersService.update(user.id, {
      token: await bcrypt.hash(refreshToken, 10),
    });

    res.cookie("refreshToken", refreshToken, {
      maxAge: Number(this.configService.get("COOKIE_TIME")),
      httpOnly: true,
    });

    return {
      message: "Signed in successfully",
      userId: user.id,
      accessToken,
    };
  }

  async refresh(
    req: Request,
    res: Response
  ): Promise<{ message: string; userId: number; accessToken: string }> {
    const refreshToken = req.cookies["refreshToken"];
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    let payload: TokenPayload;
    try {
      payload = this.jwtService.decode(refreshToken) as TokenPayload;
      const secret = this.getJwtOptions().refresh.secret;
      await this.jwtService.verifyAsync(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.usersService.findOne(payload.id, true);
    console.log(payload);
    console.log(user);
    if (!user || !user.token) {
      throw new NotFoundException("User not found or not signed in");
    }

    const isValid = await bcrypt.compare(refreshToken, user.token);
    if (!isValid) {
      throw new ForbiddenException("Invalid refresh token");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(user as any);

    await this.usersService.update(user.id!, {
      token: await bcrypt.hash(newRefreshToken, 10),
    });

    res.cookie("refreshToken", newRefreshToken, {
      maxAge: Number(this.configService.get("COOKIE_TIME")),
      httpOnly: true,
    });

    return {
      message: "Tokens refreshed successfully",
      userId: user.id!,
      accessToken,
    };
  }

  async logout(res: Response, req: Request): Promise<{ message: string }> {
    const refreshToken = req.cookies["refreshToken"];
    let payload: TokenPayload;
    try {
      payload = this.jwtService.decode(refreshToken) as TokenPayload;
    } catch {
      throw new BadRequestException("Invalid refresh token");
    }

    if (!payload) {
      throw new ForbiddenException("User not found");
    }

    await this.usersService.update(payload.id, { token: null });
    res.clearCookie("refreshToken");

    return { message: "Logged out successfully" };
  }

  async activate(activationLink: string): Promise<{ message: string }> {
    const user = await this.usersService.findByActivationLink(activationLink);
    if (!user) {
      throw new UnauthorizedException("Invalid activation link");
    }

    if (user.isActive) {
      return { message: "Account already activated" };
    }

    await this.usersService.update(user.id, { isActive: true });

    return { message: "Account activated successfully" };
  }
  async me(req: Request): Promise<Partial<User>> {
    const user = await this.usersService.findOne(req["user"].id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }
  async UpdateMe(req: Request, updateUserDto: UpdateUserDto) {
    await this.usersService.update(req["user"].id, updateUserDto);
    return { message: "Your profile updated succefully" };
  }

  async resetPassword(
    req?: Request,
    resetPasswordDto?: ResetPasswordDto,
    email?: string
  ) {
    const userId = req?.["user"]?.id;
    if (email) {
      const user = await this.prismaService.user.findUnique({
        where: { email },
      });
      if (!user) {
        throw new NotFoundException("User not found");
      }
      const otp = otpGenerator.generate(6, {
        digits: true,
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });
      await this.prismaService.user.update({
        where: { email },
        data: { reset_link: otp },
      });
      await this.mailService.sendResetMail({
        ...user,
        reset_link: otp,
      });
      return { message: "Password reset link sent to your email" };
    } else if (userId && resetPasswordDto) {
      const { oldPassword, newPassword, confirmPassword } = resetPasswordDto;
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException("User not found");
      }
      if (newPassword !== confirmPassword) {
        throw new BadRequestException("Passwords do not match");
      }
      if (!(await bcrypt.compare(oldPassword!, user.password))) {
        throw new BadRequestException("Old password doesn't not match");
      }
      if (newPassword === oldPassword) {
        throw new BadRequestException("New password must be different");
      }
      const isPasswordValid = await bcrypt.compare(oldPassword!, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException("Invalid old password");
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prismaService.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      return { message: "Password reset successfully" };
    }
  }
  async confirm_reset(id: string, password: string, confirmPassword: string) {
    const user = await this.prismaService.user.findFirst({
      where: { reset_link: id },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.reset_link !== id) {
      throw new BadRequestException("Invalid reset code");
    }
    if (password !== confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }
    if (await bcrypt.compare(password, user.password)) {
      throw new BadRequestException("New password must be different");
    }
    const hashpassword = await bcrypt.hash(password, 10);
    user.reset_link = null;
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { password: hashpassword, reset_link: user.reset_link },
    });
    return { message: "Password reset successfully" };
  }
}
