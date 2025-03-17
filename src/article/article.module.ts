import { Module } from '@nestjs/common';
import { ArticleService } from '@app/article/article.service';
import { ArticleController } from '@app/article/article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from '@app/article/entities/article.entity';
import { UserEntity } from '@app/user/entities/user.entity';
import { FollowEntity } from '@app/profile/follow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleEntity, UserEntity, FollowEntity]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
