require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { config } from './config';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // app.useGlobalFilters(new HttpExceptionFilter())
  await app.listen(config.port);
}
bootstrap();
