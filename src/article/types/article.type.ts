import { ArticleEntity } from '@app/article/entities/article.entity';

export type ArticleType = Omit<ArticleEntity, 'updateTimestamp'>;
