import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Repository } from 'typeorm';
import { UserEntity } from '@app/user/entities/user.entity';
import { ProfileResponseInterface } from '@app/profile/types/profile-response.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileType } from '@app/profile/types/profile.type';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  create(createProfileDto: CreateProfileDto) {
    return 'This action adds a new profile';
  }

  findAll() {
    return `This action returns all profile`;
  }

  async findOne(currentUserId: number, username: string) {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new HttpException(
        'Такой пользователь не существует',
        HttpStatus.NOT_FOUND,
      );
    }
    return { ...user, following: false };
  }

  buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
    delete profile.email;
    return { profile };
  }

  update(id: number, updateProfileDto: UpdateProfileDto) {
    return `This action updates a #${id} profile`;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
