import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';
export declare const ANALYTICS_EVENT_TYPES: {
    readonly DORA_SNAPSHOT: "opsera.analytics.dora.snapshot";
    readonly DEPLOYMENT_FREQUENCY_UPDATED: "opsera.analytics.deployment_frequency.updated";
    readonly LEAD_TIME_UPDATED: "opsera.analytics.lead_time.updated";
};
export interface DoraSnapshotPayload {
    readonly teamId: UUID;
    readonly windowDays: number;
    readonly deploymentFrequencyPerDay: number;
    readonly leadTimeForChangesHours: number;
    readonly changeFailureRatePct: number;
    readonly meanTimeToRestoreHours: number;
}
export type DoraSnapshotEvent = OpseraEvent<DoraSnapshotPayload>;
//# sourceMappingURL=analytics.events.d.ts.map