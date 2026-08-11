import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

export interface PrismaClient {
  $queryRaw: (query: unknown) => Promise<unknown>;
}

@Injectable()
export class PostgresHealthIndicator extends HealthIndicator {
  private static readonly TIMEOUT_MS = 3000;

  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('PostgreSQL health check timed out')),
            PostgresHealthIndicator.TIMEOUT_MS,
          ),
        ),
      ]);
      return this.getStatus(key, true);
    } catch (err) {
      throw new HealthCheckError(
        'PostgreSQL health check failed',
        this.getStatus(key, false, { error: (err as Error).message }),
      );
    }
  }
}
