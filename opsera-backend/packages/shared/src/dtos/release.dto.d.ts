import type { UUID, ISO8601Timestamp } from '../types/common.types.js';
export declare enum ReleaseStatus {
    PENDING = "PENDING",
    ANALYSIS_IN_PROGRESS = "ANALYSIS_IN_PROGRESS",
    ANALYSIS_COMPLETE = "ANALYSIS_COMPLETE",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    DEPLOYING = "DEPLOYING",
    DEPLOYED = "DEPLOYED",
    FAILED = "FAILED",
    ROLLED_BACK = "ROLLED_BACK"
}
export declare enum TargetEnvironment {
    DEVELOPMENT = "DEVELOPMENT",
    STAGING = "STAGING",
    PRODUCTION = "PRODUCTION"
}
/** Request DTO to create a new release. */
export declare class CreateReleaseDto {
    name: string;
    description?: string;
    targetEnvironmentId: string;
    changeRefs: string[];
    jiraTicket?: string;
}
/** Partial update request. */
export declare class UpdateReleaseDto {
    name?: string;
    description?: string;
    status?: ReleaseStatus;
}
/** Response shape returned by the release service. */
export interface ReleaseResponseDto {
    readonly id: UUID;
    readonly name: string;
    readonly description?: string;
    readonly status: ReleaseStatus;
    readonly targetEnvironmentId: UUID;
    readonly changeRefs: string[];
    readonly jiraTicket?: string;
    readonly createdBy: UUID;
    readonly createdAt: ISO8601Timestamp;
    readonly updatedAt: ISO8601Timestamp;
}
//# sourceMappingURL=release.dto.d.ts.map