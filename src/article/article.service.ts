import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PersistArticleDto } from '@app/article/dto/persist-article.dto';
import { UserEntity } from '@app/user/entities/user.entity';
import { ArticleEntity } from '@app/article/entities/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { ArticleResponseInterface } from '@app/article/types/article-response.interface';
import slugify from 'slugify';
import { ArticlesResponseInterface } from '@app/article/types/articles-response.Interface';
import AppDataSource from '@app/data-source';
import { FollowEntity } from '@app/profile/follow.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async create(
    currentUser: UserEntity,
    createArticleDto: PersistArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    Object.assign(article, createArticleDto);

    if (!article.tagList) {
      article.tagList = [];
    }

    article.author = currentUser;

    article.slug = this.getSlug(createArticleDto.title);

    return await this.articleRepository.save(article);
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }

  async findAll(
    userId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const queryBuilder = AppDataSource.getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    if (query.favorited) {
      const author = await this.userRepository.findOne({
        where: { username: query.favorited },
        relations: ['favorites'],
      });

      const ids = author?.favorites.map((user) => user.id);

      if (ids != undefined && ids?.length > 0) {
        queryBuilder.andWhere('articles.authorId IN (:...ids)', { ids });
      } else {
        queryBuilder.andWhere('1=0');
      }
    }

    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        where: { username: query.author },
      });
      queryBuilder.andWhere('articles.authorId = :id', { id: author?.id });
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articlesCount = await queryBuilder.getCount();

    let favoritedIds: number[] = [];

    if (userId) {
      const currentUser = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['favorites'],
      });
      if (currentUser) {
        favoritedIds = currentUser.favorites.map((favorite) => favorite.id);
      }
    }

    const articles = await queryBuilder.getMany();

    const articlesWithFavorites = articles.map((article) => {
      const isFavorited = favoritedIds.includes(article.id);
      return { ...article, favorited: isFavorited };
    });

    return { articles: articlesWithFavorites, articlesCount };
  }

  async getFeed(currentUserId: number, query: any): Promise<any> {
    const follows = await this.followRepository.find({
      where: { followerId: currentUserId },
    });

    if (follows.length === 0) {
      return {
        articles: [],
        articlesCount: 0,
      };
    }

    const followingUserIds = follows.map((follow) => follow.followingId);

    const queryBuilder = AppDataSource.getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .where('articles.authorId IN (:...ids)', { ids: followingUserIds });

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articles = await queryBuilder.getMany();

    return { articles, articlesCount };
  }

  async findBySlug(slug: string): Promise<ArticleEntity> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
    }
    return article;
  }

  async update(
    slug: string,
    currentUserId: number,
    updateArticleDto: PersistArticleDto,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    this.isAuthorOfArticle(currentUserId, article.author.id);
    Object.assign(article, updateArticleDto);
    if (updateArticleDto.title) {
      article.slug = this.getSlug(updateArticleDto.title);
    }
    return this.articleRepository.save(article);
  }

  isAuthorOfArticle(authorId: number, articleAuthorId: number): boolean {
    if (authorId !== articleAuthorId) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);
    }
    return true;
  }

  async delete(slug: string, currentUserId: number): Promise<DeleteResult> {
    const article = await this.findBySlug(slug);
    this.isAuthorOfArticle(currentUserId, article.author.id);
    return await this.articleRepository.delete({ slug });
  }

  async addArticleToFavorites(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['favorites'],
    });
    const isNotFavorited =
      user?.favorites.findIndex(
        (articleInFavorites) => articleInFavorites.id === article.id,
      ) === -1;

    if (isNotFavorited) {
      user?.favorites.push(article);
      article.favouritesCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }
    return article;
  }

  async removeArticleFromFavorites(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['favorites'],
    });

    const articleIndex = user?.favorites.findIndex(
      (articleInFavorites) => articleInFavorites.id === article.id,
    );

    if (articleIndex !== undefined && user) {
      if (articleIndex >= 0) {
        user?.favorites.splice(articleIndex, 1);
        article.favouritesCount--;
        await this.userRepository.save(user);
        await this.articleRepository.save(article);
      }
    }
    return article;
  }
}
