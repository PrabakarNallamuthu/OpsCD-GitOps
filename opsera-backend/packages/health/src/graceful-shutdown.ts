import { Logger } from '@nestjs/common';
import { setShuttingDown } from './health.controller.js';

const logger = new Logger('GracefulShutdown');

export interface ShutdownDependencies {
  disconnectKafka?: () => Promise<void>;
  disconnectPrisma?: () => Promise<void>;
  disconnectRedis?: () => Promise<void>;
  stopHttpServer?: () => Promise<void>;
}

export function registerGracefulShutdown(deps: ShutdownDependencies): void {
  process.on('SIGTERM', () => {
    shutdown(deps).catch((err: unknown) => {
      logger.error('Error during graceful shutdown', err);
      process.exit(1);
    });
  });
}

async function shutdown(deps: ShutdownDependencies): Promise<void> {
  logger.log('SIGTERM received — initiating graceful shutdown');

  // Mark as shutting down so /live returns 503
  setShuttingDown(true);

  // Allow LB to drain connections (~5s)
  logger.log('Draining load balancer connections (5s)...');
  await sleep(5000);

  // Stop accepting new HTTP connections
  if (deps.stopHttpServer) {
    logger.log('Stopping HTTP server...');
    await withTimeout(deps.stopHttpServer(), 25_000, 'HTTP server stop');
  }

  // Commit Kafka offsets and disconnect
  if (deps.disconnectKafka) {
    logger.log('Disconnecting Kafka consumer/producer...');
    await withTimeout(deps.disconnectKafka(), 10_000, 'Kafka disconnect');
  }

  // Close database connections
  if (deps.disconnectPrisma) {
    logger.log('Disconnecting Prisma...');
    await withTimeout(deps.disconnectPrisma(), 5_000, 'Prisma disconnect');
  }

  // Close Redis connections
  if (deps.disconnectRedis) {
    logger.log('Disconnecting Redis...');
    await withTimeout(deps.disconnectRedis(), 3_000, 'Redis disconnect');
  }

  logger.log('Graceful shutdown complete');
  process.exit(0);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T | void> {
  return Promise.race([
    promise,
    sleep(timeoutMs).then(() => {
      logger.warn(`${label} timed out after ${timeoutMs}ms`);
    }),
  ]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
