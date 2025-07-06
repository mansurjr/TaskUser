import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CustomJwtGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("No token provided");
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.decode(token);
      const role = decoded?.role?.toUpperCase();

      if (!role) throw new UnauthorizedException("Invalid token payload");

      const secret = this.configService.get<string>("JWT_ACCESS");
      if (!secret) throw new UnauthorizedException("Invalid token role");

      const verified = jwt.verify(token, secret);
      request["user"] = verified;

      return true;
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException("Token verification failed");
    }
  }
}
