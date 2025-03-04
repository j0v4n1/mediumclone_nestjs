import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from '@app/user/user.service';
import { CreateUserDto } from '@app/user/dto/createUser.dto';
import { UserResponseInterface } from '@app/user/types/userResponse.interface';
import { FindUserDto } from '@app/user/dto/findUser.dto';
import { Request } from 'express';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('users')
  @UsePipes(new ValidationPipe())
  async createUser(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.createUser(createUserDto);
    return this.userService.buildUserResponse(user);
  }

  @Post('users/login')
  @UsePipes(new ValidationPipe())
  async findUser(
    @Body('user') findUserDto: FindUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.findUser(findUserDto);
    return this.userService.buildUserResponse(user);
  }

  @Get('user')
  async currentUser(@Req() req: Request): Promise<UserResponseInterface> {
    return 'currentUser' as any;
  }
}
