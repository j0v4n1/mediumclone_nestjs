import { ArticleType } from '@app/article/types/article.type';
import { ArticleEntity } from '../entities/article.entity';

export interface ArticlesResponseInterface {
  articles: ArticleType[];
  articlesCount: number;
}
