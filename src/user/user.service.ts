import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { role, Task, User } from "@prisma/client";
import { CreateAdminDto } from "./dto/create-admin.dto";

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async createAdmin(
    createAdminDto: CreateAdminDto
  ): Promise<{ message: string; user: User }> {
    if (createAdminDto.password !== createAdminDto.confirm_password) {
      throw new BadRequestException("Passwords do not match");
    }

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: createAdminDto.email },
    });

    if (existingUser) {
      throw new BadRequestException("Admin with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    try {
      const user = await this.prismaService.user.create({
        data: {
          full_name: createAdminDto.full_name,
          email: createAdminDto.email,
          password: hashedPassword,
          role: role.ADMIN,
          isActive: true,
          isCreator: createAdminDto.isCreator,
          activation_link: null,
        },
      });
      return { message: "Admin created successfully", user };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException("Internal server error");
    }
  }
  async createUser(
    createUserDto: CreateUserDto
  ): Promise<{ message: string; user: User }> {
    if (createUserDto.password !== createUserDto.confirm_password) {
      throw new BadRequestException("Passwords do not match");
    }

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    try {
      const user = await this.prismaService.user.create({
        data: {
          full_name: createUserDto.full_name,
          email: createUserDto.email,
          password: hashedPassword,
          role: role.USER,
        },
      });
      return { message: "User created successfully", user };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException("Internal server error");
    }
  }

  async findAll(): Promise<Partial<User>[]> {
    return this.prismaService.user.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
      },
    });
  }

  async findOne(
    id: number,
    all?: boolean,
    task?: boolean
  ): Promise<Partial<User> | null> {
    let user: Partial<User> | null;
    if (all) {
      user = await this.prismaService.user.findUnique({
        where: { id },
      });
    } else if (task) {
      user = await this.prismaService.user.findUnique({
        where: { id },
        select: {
          full_name: true,
          email: true,
        },
      });
    } else {
      user = await this.prismaService.user.findUnique({
        where: { id },
        select: {
          full_name: true,
          email: true,
          Task: {
            select: {
              id: true,
              title: true,
              deadline: true,
            },
          },
        },
      });
    }
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  async findByActivationLink(activation_link: string): Promise<User | null> {
    return this.prismaService.user.findFirst({
      where: { activation_link: activation_link },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    try {
      return this.prismaService.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      throw new InternalServerErrorException("Failed to update user");
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    try {
      await this.prismaService.user.delete({ where: { id } });
      return { message: "User deleted successfully" };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException("Failed to delete user");
    }
  }
  async me(req: Request): Promise<{ tasks: Task[] }> {
    const tasks = await this.prismaService.task.findMany({
      where: { userId: req["user"].id },
    });
    if (!tasks) {
      throw new NotFoundException("User not found");
    }
    return { tasks };
  }
}
