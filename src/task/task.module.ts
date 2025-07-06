import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [TaskController],
  providers: [TaskService],
  imports: [PrismaModule],
  exports: [TaskService]
})
export class TaskModule {}
