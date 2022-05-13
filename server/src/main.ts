require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // app.useGlobalFilters(new HttpExceptionFilter())
  await app.listen(8080);
}
bootstrap();
