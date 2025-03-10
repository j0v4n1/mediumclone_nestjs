import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '@app/user/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/user.entity';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import 'dotenv/config';
import { FindUserDto } from '@app/user/dto/find-user.dto';
import { compare } from 'bcrypt';
import { UserResponseInterface } from '@app/user/types/user-response.interface';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  generateToken(user: UserEntity) {
    if (process.env.JWT_SECRET_REFRESH) {
      return sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET_REFRESH,
      );
    }
  }

  async findById(id: number): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  buildUserResponse(user: UserEntity): UserResponseInterface {
    const token = this.generateToken(user);
    return {
      user: {
        ...user,
        token,
      },
    };
  }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const userByEmail = await this.userRepository.findOne({
      where: {
        email: createUserDto.email,
      },
    });
    const userByUsername = await this.userRepository.findOne({
      where: {
        username: createUserDto.username,
      },
    });
    if (userByEmail || userByUsername) {
      throw new HttpException('email or username are taken', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);
    return await this.userRepository.save(newUser);
  }

  async findOne(findUserDto: FindUserDto): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: {
        email: findUserDto.email,
      },
      select: ['id', 'username', 'email', 'bio', 'image', 'password'],
    });
    if (!user) {
      throw new HttpException(
        'Sorry, this email is not registered. Please check your email or sign up for a new account.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const isValidPassword = await compare(findUserDto.password, user.password!);
    if (!isValidPassword) {
      throw new HttpException(
        'Sorry, the password you entered is incorrect. Please try again or reset your password.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    delete user.password;

    return user;
  }

  async update(userId: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findById(userId);
    if (user) {
      Object.assign(user, updateUserDto);
      return await this.userRepository.save(user);
    }
    throw new HttpException('User is does not exist', HttpStatus.NOT_FOUND);
  }
}
