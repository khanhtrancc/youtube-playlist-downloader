// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config } from './config';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
  });

  Logger.log("Config",config);
  // app.useGlobalFilters(new HttpExceptionFilter())
  await app.listen(config.port);
}
bootstrap();
