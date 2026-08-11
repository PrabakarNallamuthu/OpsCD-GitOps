import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );
  app.setGlobalPrefix('api/v1');
  await app.listen(PORT, '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start release-service', err);
  process.exit(1);
});
