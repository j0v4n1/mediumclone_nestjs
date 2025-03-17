import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from '@app/user/entities/user.entity';
import { ProfileResponseInterface } from '@app/profile/types/profile-response.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileType } from '@app/profile/types/profile.type';
import { FollowEntity } from '@app/profile/follow.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async findOne(currentUserId: number, username: string) {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new HttpException(
        'Такой пользователь не существует',
        HttpStatus.NOT_FOUND,
      );
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: currentUserId,
        followingId: user.id,
      },
    });
    return { ...user, following: Boolean(follow) };
  }

  buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
    delete profile.email;
    return { profile };
  }

  async followProfile(
    currentUserId: number,
    username: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new HttpException(
        'Такой пользователь не существует',
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.id === currentUserId) {
      throw new HttpException(
        'Нельзя подписаться на самого себя',
        HttpStatus.BAD_REQUEST,
      );
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: currentUserId,
        followingId: user.id,
      },
    });

    if (!follow) {
      const followToCreate = new FollowEntity();
      followToCreate.followerId = currentUserId;
      followToCreate.followingId = user.id;
      await this.followRepository.save(followToCreate);
    }

    return { ...user, following: true };
  }

  async unfollowProfile(
    currentUserId: number,
    username: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new HttpException(
        'Такой пользователь не существует',
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.id === currentUserId) {
      throw new HttpException(
        'Нельзя отписаться от самого себя',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.followRepository.delete({
      followerId: currentUserId,
      followingId: user.id,
    });

    return { ...user, following: false };
  }
}
