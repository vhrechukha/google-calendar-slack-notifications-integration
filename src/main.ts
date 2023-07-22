import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';

import { AppModule } from './app.module';
config();

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    await app.listen(8080);
  } catch (e) {
    new Logger().error(this.bootstrap.name, e);
  }
}
bootstrap();
