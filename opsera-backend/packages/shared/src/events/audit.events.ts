import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';
import type { AuditAction } from '../compliance/audit-action.enum.js';

export const AUDIT_EVENT_TYPES = {
  RECORD_CREATED: 'opsera.audit.record.created',
  EVIDENCE_EXPORTED: 'opsera.audit.evidence.exported',
  CHAIN_VERIFIED: 'opsera.audit.chain.verified',
  CHAIN_TAMPERED: 'opsera.audit.chain.tampered',
} as const;

export interface AuditRecordCreatedPayload {
  readonly resourceType: string;
  readonly resourceId: UUID;
  readonly action: AuditAction;
  readonly previousHash: string | null;
  readonly recordHash: string;
}

export type AuditRecordCreatedEvent = OpseraEvent<AuditRecordCreatedPayload>;
