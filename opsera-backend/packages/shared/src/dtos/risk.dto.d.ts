import type { UUID, ISO8601Timestamp } from '../types/common.types.js';
export declare enum RiskLevel {
    CRITICAL = "CRITICAL",
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW",
    NONE = "NONE"
}
export declare enum RiskRecommendation {
    GO = "GO",
    NO_GO = "NO_GO",
    GO_WITH_CONDITIONS = "GO_WITH_CONDITIONS"
}
export declare enum RiskDimension {
    CODE_CHANGE = "CODE_CHANGE",
    DEPLOYMENT_FREQUENCY = "DEPLOYMENT_FREQUENCY",
    POLICY_COMPLIANCE = "POLICY_COMPLIANCE",
    ENVIRONMENT_HEALTH = "ENVIRONMENT_HEALTH",
    CHANGE_BLAST_RADIUS = "CHANGE_BLAST_RADIUS"
}
/** A single risk finding from a scoring dimension evaluator. */
export declare class RiskFindingDto {
    dimension: RiskDimension;
    severity: RiskLevel;
    description: string;
    evidence: string;
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
export declare class TriggerRiskAnalysisDto {
    releaseId: string;
    riskThreshold: number;
}
//# sourceMappingURL=risk.dto.d.ts.map