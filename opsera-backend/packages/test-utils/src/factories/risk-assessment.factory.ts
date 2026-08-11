import { randomUUID } from 'crypto';

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type FindingStatus = 'Open' | 'Resolved' | 'Accepted';

export interface RiskFindingFactory {
  id: string;
  assessment_id: string;
  severity: Severity;
  category: string;
  description: string;
  affected_component: string;
  resolution_status: FindingStatus;
  created_at: Date;
}

export interface RiskAssessmentFactory {
  id: string;
  release_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  recommendation: 'GO' | 'NO_GO' | 'CONDITIONAL_GO';
  ai_summary: string;
  scored_at: Date;
  created_at: Date;
  updated_at: Date;
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function recommendationFromScore(score: number): RiskAssessmentFactory['recommendation'] {
  if (score >= 70) return 'NO_GO';
  if (score >= 50) return 'CONDITIONAL_GO';
  return 'GO';
}

export function buildRiskAssessment(
  releaseId: string,
  overrides: Partial<RiskAssessmentFactory> = {},
): RiskAssessmentFactory {
  const score = Math.floor(Math.random() * 100);
  return {
    id: randomUUID(),
    release_id: releaseId,
    risk_score: score,
    risk_level: riskLevelFromScore(score),
    recommendation: recommendationFromScore(score),
    ai_summary: `Risk analysis complete. Score: ${score}. ${score < 50 ? 'Safe to proceed.' : 'Review required.'}`,
    scored_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

const FINDING_CATEGORIES = ['Code Quality', 'Dependency', 'Test Coverage', 'Change Velocity', 'Compliance'];

export function buildRiskFinding(
  assessmentId: string,
  overrides: Partial<RiskFindingFactory> = {},
): RiskFindingFactory {
  return {
    id: randomUUID(),
    assessment_id: assessmentId,
    severity: 'Medium',
    category: FINDING_CATEGORIES[Math.floor(Math.random() * FINDING_CATEGORIES.length)]!,
    description: 'Risk finding detected during automated analysis',
    affected_component: 'release-service',
    resolution_status: 'Open',
    created_at: new Date(),
    ...overrides,
  };
}
