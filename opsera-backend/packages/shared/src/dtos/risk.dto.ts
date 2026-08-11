import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import type { UUID, ISO8601Timestamp } from '../types/common.types.js';

export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  NONE = 'NONE',
}

export enum RiskRecommendation {
  GO = 'GO',
  NO_GO = 'NO_GO',
  GO_WITH_CONDITIONS = 'GO_WITH_CONDITIONS',
}

export enum RiskDimension {
  CODE_CHANGE = 'CODE_CHANGE',
  DEPLOYMENT_FREQUENCY = 'DEPLOYMENT_FREQUENCY',
  POLICY_COMPLIANCE = 'POLICY_COMPLIANCE',
  ENVIRONMENT_HEALTH = 'ENVIRONMENT_HEALTH',
  CHANGE_BLAST_RADIUS = 'CHANGE_BLAST_RADIUS',
}

/** A single risk finding from a scoring dimension evaluator. */
export class RiskFindingDto {
  @IsEnum(RiskDimension)
  dimension!: RiskDimension;

  @IsEnum(RiskLevel)
  severity!: RiskLevel;

  @IsString()
  description!: string;

  @IsString()
  evidence!: string;
}

/** Full risk assessment result returned from the risk engine. */
export interface RiskAssessmentResponseDto {
  readonly id: UUID;
  readonly releaseId: UUID;
  readonly score: number;
  readonly riskLevel: RiskLevel;
  readonly recommendation: RiskRecommendation;
  readonly findings: RiskFindingDto[];
  readonly summary: string;
  readonly completedAt: ISO8601Timestamp;
  readonly durationMs: number;
}

/** Request to trigger a risk analysis. */
export class TriggerRiskAnalysisDto {
  @IsString()
  releaseId!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  riskThreshold!: number;
}
