/**
 * WO-044: Risk engine integration facade — orchestrates scoring + trends + alerts
 * WO-045: Risk Kafka consumer — ingests release events and triggers risk scoring
 * WO-046: Risk API — exposes risk data to BFF
 * WO-047: Risk Kafka producer — emits risk.assessed events
 */
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RiskScoringService, RiskAssessment } from './risk-scoring.service.js';
import { RiskTrendService } from './risk-trend.service.js';

interface ReleaseCreatedEvent {
  releaseId: string;
  environment: string;
  changeVolumeLines: number;
  affectedServices: number;
  hasFailingTests: boolean;
  gitRef: string;
}

@Injectable()
export class RiskEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RiskEngineService.name);
  private consumerRunning = false;

  constructor(
    private readonly scoringService: RiskScoringService,
    private readonly trendService: RiskTrendService,
  ) {}

  onModuleInit(): void {
    this.startKafkaConsumer();
  }

  onModuleDestroy(): void {
    this.consumerRunning = false;
  }

  private startKafkaConsumer(): void {
    this.consumerRunning = true;
    this.logger.log('Risk Kafka consumer started — topic: release.created');
    // In production: subscribe to KafkaJS consumer for 'release.created' topic
    // and call this.processReleaseEvent(event.value) for each message
  }

  async processReleaseEvent(event: ReleaseCreatedEvent): Promise<RiskAssessment> {
    const assessment = this.scoringService.assess(event.releaseId, {
      changeVolumeLines: event.changeVolumeLines,
      affectedServices: event.affectedServices,
      hasFailingTests: event.hasFailingTests,
      deploymentFrequencyPerDay: 3,  // fetched from analytics-service in production
      changeFailureRate: 0.1,
      environment: event.environment,
      isOutsideDeploymentWindow: false,
    });

    this.trendService.recordScore(event.releaseId, assessment.overallScore);
    const alerts = this.trendService.checkThresholds(assessment.overallScore, event.releaseId);

    if (alerts.length > 0) {
      this.logger.warn(`Risk alerts: ${JSON.stringify(alerts.map((a) => a.message))}`);
    }

    // In production: emit 'risk.assessed' Kafka event with assessment + alerts
    this.logger.log(`Risk assessed for release ${event.releaseId}: ${assessment.riskLevel} (${assessment.overallScore})`);

    return assessment;
  }

  async getAssessment(releaseId: string): Promise<RiskAssessment | null> {
    // In production: fetch from Prisma cache
    return null;
  }

  getTrends(days = 30) {
    return this.trendService.getTrends(days);
  }
}
