/**
 * @opsera/kafka — shared Kafka producer/consumer abstractions.
 * Full implementation wired in WO-021. This stub defines the interfaces
 * and topic naming conventions consumed by all services.
 */

import { KAFKA_TOPIC_PREFIX } from '@opsera/shared';

export { KAFKA_TOPIC_PREFIX };

/** Opsera domain event topics — all prefixed with 'opsera.' */
export const TOPICS = {
  RELEASE_CREATED: `${KAFKA_TOPIC_PREFIX}release.created`,
  RELEASE_UPDATED: `${KAFKA_TOPIC_PREFIX}release.updated`,
  ANALYSIS_REQUESTED: `${KAFKA_TOPIC_PREFIX}risk.analysis.requested`,
  ANALYSIS_COMPLETED: `${KAFKA_TOPIC_PREFIX}risk.analysis.completed`,
  POLICY_EVALUATED: `${KAFKA_TOPIC_PREFIX}policy.evaluated`,
  AUDIT_EVENT: `${KAFKA_TOPIC_PREFIX}audit.event`,
  VERIFICATION_REQUESTED: `${KAFKA_TOPIC_PREFIX}verification.requested`,
  VERIFICATION_COMPLETED: `${KAFKA_TOPIC_PREFIX}verification.completed`,
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

/** Envelope wrapping every Opsera Kafka message. */
export interface KafkaMessage<T = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly version: '1.0';
  readonly payload: T;
}

/** Minimal producer interface — implemented in WO-021. */
export interface KafkaProducer {
  publish<T>(topic: Topic, message: KafkaMessage<T>): Promise<void>;
  disconnect(): Promise<void>;
}

/** Minimal consumer interface — implemented in WO-021. */
export interface KafkaConsumer {
  subscribe(topics: Topic[], handler: (message: KafkaMessage) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
}
