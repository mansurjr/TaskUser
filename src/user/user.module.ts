import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [PrismaModule, AuthModule, JwtModule],
  exports: [UserService],
})
export class UserModule {}
