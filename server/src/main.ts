require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { config } from './config';
import { db, init } from './helpers/db';
import { HttpExceptionFilter } from './helpers/exception.filter';
import { AppModule } from './modules/app.module';
import { videoJob } from './modules/video/video.job';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  videoJob.startDownloadJob();
  // app.useGlobalFilters(new HttpExceptionFilter())
  await app.listen(3000);
}
bootstrap();
