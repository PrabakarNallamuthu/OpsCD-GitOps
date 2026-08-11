import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';
import type { ReleaseStatus } from '../dtos/release.dto.js';
export declare const RELEASE_EVENT_TYPES: {
    readonly CREATED: "opsera.release.created";
    readonly UPDATED: "opsera.release.updated";
    readonly STATUS_CHANGED: "opsera.release.status_changed";
    readonly ANALYSIS_REQUESTED: "opsera.release.analysis_requested";
    readonly DEPLOYED: "opsera.release.deployed";
    readonly ROLLED_BACK: "opsera.release.rolled_back";
};
export interface ReleaseCreatedPayload {
    readonly releaseId: UUID;
    readonly name: string;
    readonly targetEnvironmentId: UUID;
    readonly changeRefs: string[];
}
export interface ReleaseStatusChangedPayload {
    readonly releaseId: UUID;
    readonly previousStatus: ReleaseStatus;
    readonly newStatus: ReleaseStatus;
    readonly reason?: string;
}
export type ReleaseCreatedEvent = OpseraEvent<ReleaseCreatedPayload>;
export type ReleaseStatusChangedEvent = OpseraEvent<ReleaseStatusChangedPayload>;
//# sourceMappingURL=release.events.d.ts.map