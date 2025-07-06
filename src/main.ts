import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import * as readline from "readline";
import * as bcrypt from "bcrypt";
import { PrismaService } from "./prisma/prisma.service";
import * as chalk from "chalk";

async function createSuperAdmin(prisma: PrismaService) {

  const hashed = await bcrypt.hash("qwerty123", 10);

  const admin = await prisma.user.findFirst({
    where: {
      email: "exmpleAdmin@gmail.com",
    },
  });

  if (admin) {
    console.log(chalk.greenBright("✅ Super Admin already exists!"));
    return;
  }

  await prisma.user.create({
    data: {
      email: "exmpleAdmin@gmail.com",
      full_name: "Super Admin Test",
      password: hashed,
      role: "ADMIN",
      isCreator: true,
      isActive: true,
    },
  });

  console.log(chalk.greenBright("✅ Super Admin created successfully!"));
}

async function start() {
  try {
    const PORT = process.env.PORT ?? 3030;
    const app = await NestFactory.create(AppModule);
    const prisma = app.get(PrismaService);

    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());

    await createSuperAdmin(prisma);

    await app.listen(PORT);
    console.log(
      chalk.blueBright(
        `🚀 Server started at: ${chalk.bold(`http://localhost:${PORT}`)}`
      )
    );
  } catch (error) {
    console.log(chalk.red("❌ Error starting application:"), error);
  }
}

start();
