import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Producer, CompressionTypes } from 'kafkajs';
import { getCorrelationContext } from '@opsera/logging';
import { v4 as uuidv4 } from 'uuid';
import type { KafkaModuleConfig } from '../config/kafka.config.js';

export interface OpseraEvent<T = unknown> {
  id?: string;
  type: string;
  version: string;
  payload: T;
  metadata?: Record<string, string>;
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer!: Producer;

  constructor(private readonly config: KafkaModuleConfig) {}

  async onModuleInit(): Promise<void> {
    const kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      ssl: this.config.ssl,
      sasl: this.config.sasl as Parameters<typeof Kafka>[0]['sasl'],
    });

    this.producer = kafka.producer({
      idempotent: true,
      maxInFlightRequests: 5,
      allowAutoTopicCreation: false,
    });

    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer?.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  async publish<T>(topic: string, event: OpseraEvent<T>): Promise<void> {
    const eventId = event.id ?? uuidv4();
    const ctx = getCorrelationContext();

    const headers: Record<string, string> = {
      'event-id': eventId,
      'event-type': event.type,
      'event-version': event.version,
      'correlation-id': ctx?.correlationId ?? 'unknown',
      'produced-at': new Date().toISOString(),
      'producer-id': this.config.clientId,
      ...event.metadata,
    };

    if (ctx?.actorId) {
      headers['actor-id'] = ctx.actorId;
    }

    try {
      await this.producer.send({
        topic,
        compression: CompressionTypes.GZIP,
        messages: [
          {
            key: eventId,
            value: JSON.stringify({ id: eventId, ...event }),
            headers,
          },
        ],
      });

      this.logger.debug({
        message: `Published event to ${topic}`,
        topic,
        eventId,
        eventType: event.type,
      });
    } catch (err) {
      this.logger.error({
        message: `Failed to publish event to ${topic}`,
        topic,
        eventId,
        error: (err as Error).message,
      });
      throw err;
    }
  }
}
