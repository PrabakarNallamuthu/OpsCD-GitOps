import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';
import type { ReleaseStatus } from '../dtos/release.dto.js';

export const RELEASE_EVENT_TYPES = {
  CREATED: 'opsera.release.created',
  UPDATED: 'opsera.release.updated',
  STATUS_CHANGED: 'opsera.release.status_changed',
  ANALYSIS_REQUESTED: 'opsera.release.analysis_requested',
  DEPLOYED: 'opsera.release.deployed',
  ROLLED_BACK: 'opsera.release.rolled_back',
} as const;

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
