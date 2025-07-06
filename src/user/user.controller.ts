import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CustomJwtGuard } from "../common/guards/jwt.guard";
import { Roles } from "../common/decorators/role";
import { RolesGuard } from "../common/guards/role.guard";

@Controller("user")
@Roles() 
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("admin")
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles("ADMIN")
  createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.userService.createAdmin(createUserDto);
  }

  @Post("user")
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles("ADMIN")
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles("ADMIN")
  findAll() {
    return this.userService.findAll();
  }

  @Get("me")
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles("ADMIN", "USER")
  me(@Req() req: Request) {
    return this.userService.me(req);
  }

  @Get(":id")
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles("ADMIN")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles("ADMIN")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(":id")
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles("ADMIN")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
