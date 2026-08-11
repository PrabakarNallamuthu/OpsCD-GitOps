import { DynamicModule, Global, Module, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CredentialWatcherService } from './credential-watcher.service.js';
import { buildConnectionUrlFromEnv } from '@opsera/prisma-config';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

export interface DatabaseModuleOptions {
  schema: string;
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    const logger = new Logger('DatabaseModule');

    const prismaProvider = {
      provide: PRISMA_CLIENT,
      inject: [CredentialWatcherService],
      useFactory: async (watcher: CredentialWatcherService) => {
        const connectionUrl = buildConnectionUrlFromEnv(options.schema);
        const client = new PrismaClient({
          datasources: { db: { url: connectionUrl } },
          log: [{ emit: 'event', level: 'error' }],
        });

        await client.$connect();
        logger.log(`PrismaClient connected to schema: ${options.schema}`);

        watcher.on('credentials-changed', async () => {
          logger.log('Re-connecting PrismaClient with rotated credentials');
          const retries = 3;
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              await client.$disconnect();
              const newUrl = buildConnectionUrlFromEnv(options.schema);
              (client as PrismaClient & { _engineConfig: { url: string } })._engineConfig.url =
                newUrl;
              await client.$connect();
              logger.log('PrismaClient reconnected successfully');
              return;
            } catch (err) {
              logger.warn(`Reconnect attempt ${attempt}/${retries} failed: ${String(err)}`);
              if (attempt < retries) {
                await new Promise((r) => setTimeout(r, 5000 * attempt));
              }
            }
          }
          logger.error('Failed to reconnect after credential rotation — manual intervention required');
        });

        return client;
      },
    };

    return {
      module: DatabaseModule,
      providers: [CredentialWatcherService, prismaProvider],
      exports: [PRISMA_CLIENT, CredentialWatcherService],
    };
  }
}
