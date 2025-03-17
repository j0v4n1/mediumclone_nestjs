import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '@app/user/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/entities/user.entity';
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
    const errorResponse: { errors: { [key: string]: string } } = { errors: {} };

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

    if (userByEmail) {
      errorResponse.errors['email'] = 'Электронная почта уже занята';
    }

    if (userByUsername) {
      errorResponse.errors['username'] = 'Имя пользователя уже занято';
    }

    if (userByEmail || userByUsername) {
      throw new HttpException(
        'Электронная почта или юзернейм уже заняты',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);
    const savedUser = await this.userRepository.save(newUser);
    delete savedUser.password;
    return savedUser;
  }

  async login(findUserDto: FindUserDto): Promise<UserEntity> {
    const errorResponse: { errors: { [key: string]: string } } = { errors: {} };

    const user = await this.userRepository.findOne({
      where: {
        email: findUserDto.email,
      },
      select: ['id', 'username', 'email', 'bio', 'image', 'password'],
    });

    if (!user) {
      errorResponse.errors['email'] = 'Такой email не зарегистрирован';
      throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const isValidPassword = await compare(findUserDto.password, user.password!);

    if (!isValidPassword) {
      errorResponse.errors['password'] = 'Пароль неверен';
      throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    delete user.password;

    return user;
  }

  async update(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const user = await this.findById(userId);
    if (user) {
      Object.assign(user, updateUserDto);
      return await this.userRepository.save(user);
    }
    throw new HttpException('User is does not exist', HttpStatus.NOT_FOUND);
  }
}
