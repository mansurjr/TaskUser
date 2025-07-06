import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { PrismaService } from "../prisma/prisma.service";
import { TaskStatus } from "@prisma/client";

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    const { title, description, userId, deadline } = createTaskDto;
    return this.prisma.task.create({
      data: {
        title: String(title),
        description: description ? String(description) : undefined,
        userId,
        deadline,
      },
    });
  }

  async findAll() {
    return this.prisma.task.findMany({
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        title: updateTaskDto.title ? String(updateTaskDto.title) : undefined,
        description: updateTaskDto.description
          ? String(updateTaskDto.description)
          : undefined,
        userId: updateTaskDto.userId,
        deadline: updateTaskDto.deadline,
      },
    });
  }

  async remove(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    this.prisma.task.delete({
      where: { id },
    });
    return { message: "Task deleted successfully" };
  }
  async updateStatus(id: number, status: TaskStatus) {
    const Task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!Task) {
      throw new NotFoundException("Task not found");
    }
    return this.prisma.task.update({
      where: { id },
      data: {
        status,
      },
    });
  }
}
