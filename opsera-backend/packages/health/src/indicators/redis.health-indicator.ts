import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

export interface RedisClient {
  ping: () => Promise<string>;
}

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private static readonly TIMEOUT_MS = 2000;

  constructor(private readonly redis: RedisClient) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await Promise.race([
        this.redis.ping(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Redis PING timed out')),
            RedisHealthIndicator.TIMEOUT_MS,
          ),
        ),
      ]);

      if (result !== 'PONG') {
        throw new Error(`Unexpected Redis PING response: ${result}`);
      }

      return this.getStatus(key, true);
    } catch (err) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, { error: (err as Error).message }),
      );
    }
  }
}
