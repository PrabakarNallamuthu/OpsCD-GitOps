import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';

export const ANALYTICS_EVENT_TYPES = {
  DORA_SNAPSHOT: 'opsera.analytics.dora.snapshot',
  DEPLOYMENT_FREQUENCY_UPDATED: 'opsera.analytics.deployment_frequency.updated',
  LEAD_TIME_UPDATED: 'opsera.analytics.lead_time.updated',
} as const;

export interface DoraSnapshotPayload {
  readonly teamId: UUID;
  readonly windowDays: number;
  readonly deploymentFrequencyPerDay: number;
  readonly leadTimeForChangesHours: number;
  readonly changeFailureRatePct: number;
  readonly meanTimeToRestoreHours: number;
}

export type DoraSnapshotEvent = OpseraEvent<DoraSnapshotPayload>;
