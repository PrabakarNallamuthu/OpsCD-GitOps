import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

export interface KafkaAdmin {
  describeCluster: () => Promise<{ brokers: unknown[] }>;
}

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  private static readonly TIMEOUT_MS = 5000;

  constructor(private readonly admin: KafkaAdmin) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const cluster = await Promise.race([
        this.admin.describeCluster(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Kafka health check timed out')),
            KafkaHealthIndicator.TIMEOUT_MS,
          ),
        ),
      ]);

      return this.getStatus(key, true, {
        brokerCount: cluster.brokers.length,
      });
    } catch (err) {
      throw new HealthCheckError(
        'Kafka health check failed',
        this.getStatus(key, false, { error: (err as Error).message }),
      );
    }
  }
}
