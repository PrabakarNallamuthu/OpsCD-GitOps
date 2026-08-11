import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { DoraMetricsCalculator, type DeploymentEvent } from './calculators/dora-metrics.calculator.js';

@Injectable()
export class AnalyticsKafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsKafkaConsumerService.name);
  private consumer!: Consumer;
  private readonly dlqTopic = 'analytics.dlq';

  constructor(
    private readonly config: ConfigService,
    private readonly dora: DoraMetricsCalculator,
  ) {}

  async onModuleInit(): Promise<void> {
    const kafka = new Kafka({
      clientId: 'analytics-service',
      brokers: this.config.getOrThrow<string>('KAFKA_BROKERS').split(','),
      ssl: this.config.get<boolean>('KAFKA_SSL', true),
      sasl: {
        mechanism: 'scram-sha-512',
        username: this.config.getOrThrow<string>('KAFKA_USERNAME'),
        password: this.config.getOrThrow<string>('KAFKA_PASSWORD'),
      },
      logLevel: logLevel.WARN,
    });

    this.consumer = kafka.consumer({ groupId: 'analytics-service' });
    const dlqProducer = kafka.producer();
    await Promise.all([this.consumer.connect(), dlqProducer.connect()]);

    const topics = [
      'releases.created',
      'releases.deployed',
      'risk.analysis_completed',
      'verification.completed',
      'policy.evaluated',
    ];

    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        const raw = message.value?.toString() ?? '{}';
        try {
          const event = JSON.parse(raw) as Record<string, unknown>;
          await this.dispatch(topic, event);

          await this.consumer.commitOffsets([
            { topic, partition, offset: (Number(message.offset) + 1).toString() },
          ]);
        } catch (err) {
          this.logger.error(`Analytics consumer error on ${topic}: ${(err as Error).message}`);
          await dlqProducer.send({
            topic: this.dlqTopic,
            messages: [{
              value: JSON.stringify({
                original_topic: topic,
                original_payload: raw,
                error_reason: (err as Error).message,
                failed_at: new Date().toISOString(),
              }),
            }],
          });
          await this.consumer.commitOffsets([
            { topic, partition, offset: (Number(message.offset) + 1).toString() },
          ]);
        }
      },
    });

    this.logger.log('Analytics Kafka consumer started');
  }

  private async dispatch(topic: string, event: Record<string, unknown>): Promise<void> {
    switch (topic) {
      case 'releases.deployed': {
        const deployEvent: DeploymentEvent = {
          teamId: event['team_id'] as string,
          serviceId: event['service_id'] as string,
          orgId: event['org_id'] as string,
          releaseId: event['release_id'] as string | undefined,
          commitSha: event['commit_sha'] as string | undefined,
          deployedAt: new Date((event['deployed_at'] ?? event['timestamp']) as string),
          isSuccessful: (event['status'] as string) === 'success',
          leadTimeSecs: event['lead_time_secs'] as number | undefined,
        };
        await this.dora.onDeploymentEvent(deployEvent);
        break;
      }
      case 'verification.completed': {
        const teamId = event['team_id'] as string;
        const serviceId = event['service_id'] as string;
        const orgId = event['org_id'] as string;
        if (teamId && serviceId) {
          await this.dora.computeChangeFailureRate(teamId, serviceId, new Date());
        }
        void orgId;
        break;
      }
      default:
        this.logger.debug(`Analytics: no handler for topic ${topic}`);
    }
  }
}
