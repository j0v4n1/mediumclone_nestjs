import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { UserEntity } from '@app/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowEntity } from '@app/profile/follow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FollowEntity])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
