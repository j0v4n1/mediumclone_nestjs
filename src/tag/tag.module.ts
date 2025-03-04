import { Module } from '@nestjs/common';
import { TagController } from '@app/tag/tag.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagEntity } from '@app/tag/tag.entity';
import { TagService } from '@app/tag/tag.service';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity])],
  providers: [TagService],
  controllers: [TagController],
})
export class TagModule {}
