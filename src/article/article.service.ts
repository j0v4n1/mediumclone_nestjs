import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PersistArticleDto } from './dto/persist-article.dto';
import { UserEntity } from '@app/user/user.entity';
import { ArticleEntity } from './entities/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, getRepository, Repository } from 'typeorm';
import { ArticleResponseInterface } from './types/article-response.interface';
import slugify from 'slugify';
import { ArticlesResponseInterface } from './types/articles-response.Interface';
import ormconfig from '@app/ormconfig';
import AppDataSource from '@app/data-source';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
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
      slugify(title, { lower: true }) + '-' + ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }

  async findAll(userId: number, query: any): Promise<ArticlesResponseInterface> {
    const queryBuilder = AppDataSource.getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articlesCount = await queryBuilder.getCount();

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
}
