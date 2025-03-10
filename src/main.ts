if (!process.env.IS_TS_NODE) {
  require('module-alias/register');
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

if (process.env.PORT) {
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT as string);
  }
  bootstrap();
}
