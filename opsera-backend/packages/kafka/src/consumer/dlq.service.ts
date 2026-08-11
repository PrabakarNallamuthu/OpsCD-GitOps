import { Injectable, Logger } from '@nestjs/common';
import type { KafkaProducerService } from '../producer/kafka-producer.service.js';

export interface DlqMessage {
  originalTopic: string;
  originalKey: string | undefined;
  originalValue: string;
  originalHeaders: Record<string, string>;
  error: string;
  retryCount: number;
  failedAt: string;
}

@Injectable()
export class DlqService {
  private readonly logger = new Logger(DlqService.name);

  constructor(private readonly producer: KafkaProducerService) {}

  async sendToDlq(dlqMessage: DlqMessage): Promise<void> {
    const dlqTopic = `${dlqMessage.originalTopic}.dlq`;

    this.logger.warn({
      message: `Sending message to DLQ: ${dlqTopic}`,
      originalTopic: dlqMessage.originalTopic,
      error: dlqMessage.error,
      retryCount: dlqMessage.retryCount,
    });

    await this.producer.publish(dlqTopic, {
      type: 'DLQ_MESSAGE',
      version: '1.0',
      payload: dlqMessage,
      metadata: {
        'dlq-original-topic': dlqMessage.originalTopic,
        'dlq-error': dlqMessage.error.slice(0, 500),
        'dlq-retry-count': String(dlqMessage.retryCount),
      },
    });
  }
}
