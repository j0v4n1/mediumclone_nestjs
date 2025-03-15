import { ExpressRequestInterface } from '@app/types/expressRequest.interface';
import { UserEntity } from '@app/user/entities/user.entity';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: keyof UserEntity, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ExpressRequestInterface>();

    if (!request.user) {
      return null;
    }

    if (data) {
      return request.user[data];
    }

    return request.user;
  },
);
