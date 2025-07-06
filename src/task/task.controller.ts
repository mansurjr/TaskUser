import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  ParseEnumPipe,
  UseGuards,
} from "@nestjs/common";
import { TaskService } from "./task.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskStatus } from "@prisma/client";
import { Roles } from "../common/decorators/role";
import { RolesGuard } from "../common/guards/role.guard";
import { CustomJwtGuard } from "../common/guards/jwt.guard";

@Controller("task")
@Roles()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}
  @Roles("ADMIN")
  @UseGuards(RolesGuard, CustomJwtGuard)
  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Roles("ADMIN")
  @UseGuards(RolesGuard, CustomJwtGuard)
  @Get()
  async findAll() {
    return this.taskService.findAll();
  }

  @Roles("ADMIN")
  @UseGuards(RolesGuard, CustomJwtGuard)
  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Roles("ADMIN")
  @UseGuards(RolesGuard, CustomJwtGuard)
  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto
  ) {
    return this.taskService.update(id, updateTaskDto);
  }

  @Roles("ADMIN")
  @UseGuards(RolesGuard, CustomJwtGuard)
  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.taskService.remove(id);
  }

  @Roles("ADMIN", "USER")
  @UseGuards(RolesGuard, CustomJwtGuard)
  @Patch(":id/status")
  async updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body("status", new ParseEnumPipe(TaskStatus)) status: TaskStatus
  ) {
    return this.taskService.updateStatus(id, status);
  }
}
