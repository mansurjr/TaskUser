import { forwardRef, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "../user/user.module";
import { MailService } from "./mail.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, MailService],
  imports: [PrismaModule, JwtModule.register({}), ConfigModule, forwardRef(()=> UserModule)],
  exports: [AuthService, MailService, JwtModule],
})
export class AuthModule {}