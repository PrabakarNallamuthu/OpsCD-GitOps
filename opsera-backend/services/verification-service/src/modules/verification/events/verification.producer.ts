/**
 * WO-102: Verification Kafka Event Schemas and Audit Integration
 * Typed Kafka producers for all 7 verification lifecycle events.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, logLevel } from 'kafkajs';

export type VerificationEventType =
  | 'verification.started'
  | 'verification.health_check_completed'
  | 'verification.baseline_captured'
  | 'verification.metrics_compared'
  | 'verification.anomaly_detected'
  | 'verification.verdict_issued'
  | 'verification.completed';

export interface BaseVerificationEvent {
  eventId: string;
  eventType: VerificationEventType;
  releaseId: string;
  deploymentId?: string;
  timestamp: string;
  correlationId: string;
}

@Injectable()
export class VerificationProducer implements OnModuleInit {
  private readonly logger = new Logger(VerificationProducer.name);
  private producer!: Producer;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const kafka = new Kafka({
      clientId: 'verification-service',
      brokers: this.config.getOrThrow<string>('KAFKA_BROKERS').split(','),
      logLevel: logLevel.WARN,
    });
    this.producer = kafka.producer({ idempotent: true });
    await this.producer.connect();
  }

  async emitStarted(releaseId: string, deploymentId: string, correlationId: string): Promise<void> {
    await this.emit('verification.started', releaseId, deploymentId, correlationId, {
      status: 'started',
    });
  }

  async emitHealthCheckCompleted(
    releaseId: string,
    correlationId: string,
    payload: { passed: boolean; failedServices: string[] },
  ): Promise<void> {
    await this.emit('verification.health_check_completed', releaseId, undefined, correlationId, payload);
  }

  async emitBaselineCaptured(
    releaseId: string,
    correlationId: string,
    payload: { baseline_id: string; metrics_captured: number },
  ): Promise<void> {
    await this.emit('verification.baseline_captured', releaseId, undefined, correlationId, payload);
  }

  async emitMetricsCompared(
    releaseId: string,
    correlationId: string,
    payload: { exceeded_count: number; within_count: number },
  ): Promise<void> {
    await this.emit('verification.metrics_compared', releaseId, undefined, correlationId, payload);
  }

  async emitAnomalyDetected(
    releaseId: string,
    correlationId: string,
    payload: { anomaly_count: number; max_severity: string },
  ): Promise<void> {
    await this.emit('verification.anomaly_detected', releaseId, undefined, correlationId, payload);
  }

  async emitVerdictIssued(
    releaseId: string,
    correlationId: string,
    payload: { verdict: string; rollback_recommended: boolean },
  ): Promise<void> {
    await this.emit('verification.verdict_issued', releaseId, undefined, correlationId, payload);
  }

  async emitCompleted(
    releaseId: string,
    correlationId: string,
    payload: { verdict: string; duration_ms: number },
  ): Promise<void> {
    await this.emit('verification.completed', releaseId, undefined, correlationId, payload);
  }

  private async emit(
    eventType: VerificationEventType,
    releaseId: string,
    deploymentId: string | undefined,
    correlationId: string,
    additionalPayload: Record<string, unknown>,
  ): Promise<void> {
    const event: BaseVerificationEvent & Record<string, unknown> = {
      eventId: crypto.randomUUID(),
      eventType,
      releaseId,
      deploymentId,
      timestamp: new Date().toISOString(),
      correlationId,
      ...additionalPayload,
    };

    try {
      await this.producer.send({
        topic: eventType,
        messages: [{ value: JSON.stringify(event), key: releaseId }],
      });
    } catch (err) {
      this.logger.error(`Failed to emit ${eventType}: ${(err as Error).message}`);
    }
  }
}
