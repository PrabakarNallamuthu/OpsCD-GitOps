import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { AuditRecordRepository, type CreateAuditRecordDto } from './audit-record.repository.js';

/** Compliance framework mapping by topic pattern */
const TOPIC_COMPLIANCE_MAP: Record<string, string[]> = {
  'releases.': ['SOX', 'SOC2', 'DORA'],
  'risk.': ['SOC2', 'SOX'],
  'policy.': ['SOC2', 'PCI-DSS'],
  'verification.': ['SOX', 'SOC2', 'DORA'],
  'analytics.': ['DORA'],
  'auth.': ['SOC2', 'PCI-DSS'],
};

/** Actor extraction by event structure */
function extractActor(payload: Record<string, unknown>): string {
  return (payload['actor_id'] ?? payload['user_id'] ?? payload['approver_id'] ?? 'system') as string;
}

function getComplianceFrameworks(topic: string): string[] {
  for (const [prefix, frameworks] of Object.entries(TOPIC_COMPLIANCE_MAP)) {
    if (topic.startsWith(prefix)) return frameworks;
  }
  return ['SOC2'];
}

@Injectable()
export class AuditKafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(AuditKafkaConsumerService.name);
  private consumer!: Consumer;
  private readonly dlqTopic = 'audit.dlq';

  constructor(
    private readonly repo: AuditRecordRepository,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const kafka = new Kafka({
      clientId: 'audit-service',
      brokers: this.config.getOrThrow<string>('KAFKA_BROKERS').split(','),
      ssl: this.config.get<boolean>('KAFKA_SSL', true),
      sasl: {
        mechanism: 'scram-sha-512',
        username: this.config.getOrThrow<string>('KAFKA_USERNAME'),
        password: this.config.getOrThrow<string>('KAFKA_PASSWORD'),
      },
      logLevel: logLevel.WARN,
    });

    this.consumer = kafka.consumer({
      groupId: 'audit-service-consumer',
      sessionTimeout: 30_000,
      heartbeatInterval: 3_000,
    });

    const dlqProducer = kafka.producer();
    await dlqProducer.connect();
    await this.consumer.connect();

    const topicPatterns = [
      /^releases\./,
      /^risk\./,
      /^policy\./,
      /^verification\./,
      /^analytics\./,
      /^auth\./,
    ];

    // Subscribe to each topic pattern via explicit topic list from config
    const topics = this.config
      .get<string>('AUDIT_SUBSCRIBED_TOPICS', '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      autoCommit: false, // manual at-least-once semantics
      eachMessage: async (payload: EachMessagePayload) => {
        const { topic, partition, message } = payload;
        const raw = message.value?.toString() ?? '{}';

        try {
          const event = JSON.parse(raw) as Record<string, unknown>;
          const dto = this.transformToAuditRecord(topic, event);

          await this.repo.create(dto);

          // Commit offset only after successful INSERT
          await this.consumer.commitOffsets([
            {
              topic,
              partition,
              offset: (Number(message.offset) + 1).toString(),
            },
          ]);
        } catch (err) {
          this.logger.error(`Failed to process audit event from ${topic}: ${(err as Error).message}`);
          try {
            await dlqProducer.send({
              topic: this.dlqTopic,
              messages: [
                {
                  value: JSON.stringify({
                    original_topic: topic,
                    original_partition: partition,
                    original_offset: message.offset,
                    original_payload: raw,
                    error_reason: (err as Error).message,
                    failed_at: new Date().toISOString(),
                  }),
                },
              ],
            });
          } catch (dlqErr) {
            this.logger.error(`Failed to write to DLQ: ${(dlqErr as Error).message}`);
          }
          // Commit offset even for failures routed to DLQ to avoid endless retry
          await this.consumer.commitOffsets([
            { topic, partition, offset: (Number(message.offset) + 1).toString() },
          ]);
        }
      },
    });

    this.logger.log(`Audit Kafka consumer started, subscribed to ${topics.length} topics`);
    void topicPatterns; // referenced for future regex-based subscription
  }

  private transformToAuditRecord(topic: string, event: Record<string, unknown>): CreateAuditRecordDto {
    const eventType = `${topic}.${event['event_type'] ?? 'unknown'}`;
    const action = (event['action'] ?? event['event_type'] ?? 'event') as string;

    return {
      event_type: eventType,
      actor_id: extractActor(event),
      resource_type: (event['resource_type'] ?? topic.split('.')[0] ?? 'unknown') as string,
      resource_id: (event['resource_id'] ?? event['release_id'] ?? event['assessment_id'] ?? '00000000-0000-0000-0000-000000000000') as string,
      action,
      payload: event,
      correlation_id: (event['correlation_id'] ?? event['pipeline_id'] ?? crypto.randomUUID()) as string,
      compliance_frameworks: getComplianceFrameworks(topic),
      event_timestamp: event['timestamp'] ? new Date(event['timestamp'] as string) : new Date(),
    };
  }
}
