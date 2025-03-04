import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { ExpressRequestInterface } from '@app/types/expressRequest.interface';
import { JwtPayload, verify } from 'jsonwebtoken';
import 'dotenv/config';
import { UserService } from '@app/user/user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}
  async use(req: ExpressRequestInterface, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null;
      next();
      return;
    }
    const token = req.headers.authorization.split(' ')[1];
    try {
      if (process.env.JWT_SECRET_REFRESH) {
        const decode = verify(
          token,
          process.env.JWT_SECRET_REFRESH,
        ) as JwtPayload;
        const user = await this.userService.findById(decode.id);
        req.user = user;
        next();
      }
    } catch (error) {
      req.user = null;
      next();
    }
  }
}
