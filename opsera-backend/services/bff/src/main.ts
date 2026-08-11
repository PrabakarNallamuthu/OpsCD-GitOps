import { NestFactory } from '@nestjs/core';
import { BffModule } from './modules/bff/bff.module.js';

async function bootstrap() {
  const app = await NestFactory.create(BffModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true });
  await app.listen(process.env.PORT ?? 3006);
  console.log(`BFF service running on port ${process.env.PORT ?? 3006}`);
}

bootstrap();
