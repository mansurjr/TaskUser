import { TaskStatus } from "@prisma/client";

export class CreateTaskDto {
  title: String;
  description?: String;
  userId: number;
  deadline: Date;
}
