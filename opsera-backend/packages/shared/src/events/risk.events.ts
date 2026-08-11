import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';
import type { RiskLevel, RiskRecommendation } from '../dtos/risk.dto.js';

export const RISK_EVENT_TYPES = {
  ANALYSIS_REQUESTED: 'opsera.risk.analysis.requested',
  ANALYSIS_COMPLETED: 'opsera.risk.analysis.completed',
  ANALYSIS_FAILED: 'opsera.risk.analysis.failed',
  THRESHOLD_EXCEEDED: 'opsera.risk.threshold.exceeded',
} as const;

export interface RiskAnalysisRequestedPayload {
  readonly releaseId: UUID;
  readonly riskThreshold: number;
}

export interface RiskAnalysisCompletedPayload {
  readonly releaseId: UUID;
  readonly assessmentId: UUID;
  readonly score: number;
  readonly riskLevel: RiskLevel;
  readonly recommendation: RiskRecommendation;
  readonly durationMs: number;
}

export interface RiskAnalysisFailedPayload {
  readonly releaseId: UUID;
  readonly reason: string;
  readonly retryCount: number;
}

export type RiskAnalysisRequestedEvent = OpseraEvent<RiskAnalysisRequestedPayload>;
export type RiskAnalysisCompletedEvent = OpseraEvent<RiskAnalysisCompletedPayload>;
export type RiskAnalysisFailedEvent = OpseraEvent<RiskAnalysisFailedPayload>;
