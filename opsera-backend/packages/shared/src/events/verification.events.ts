import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';

export const VERIFICATION_EVENT_TYPES = {
  REQUESTED: 'opsera.verification.requested',
  COMPLETED: 'opsera.verification.completed',
  FAILED: 'opsera.verification.failed',
} as const;

export enum VerificationVerdict {
  PASS = 'PASS',
  FAIL = 'FAIL',
  INCONCLUSIVE = 'INCONCLUSIVE',
}

export interface VerificationCompletedPayload {
  readonly releaseId: UUID;
  readonly verificationId: UUID;
  readonly verdict: VerificationVerdict;
  readonly anomaliesDetected: number;
  readonly durationMs: number;
}

export type VerificationCompletedEvent = OpseraEvent<VerificationCompletedPayload>;
