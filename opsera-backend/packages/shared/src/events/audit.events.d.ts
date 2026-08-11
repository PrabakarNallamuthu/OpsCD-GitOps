import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';
import type { AuditAction } from '../compliance/audit-action.enum.js';
export declare const AUDIT_EVENT_TYPES: {
    readonly RECORD_CREATED: "opsera.audit.record.created";
    readonly EVIDENCE_EXPORTED: "opsera.audit.evidence.exported";
    readonly CHAIN_VERIFIED: "opsera.audit.chain.verified";
    readonly CHAIN_TAMPERED: "opsera.audit.chain.tampered";
};
export interface AuditRecordCreatedPayload {
    readonly resourceType: string;
    readonly resourceId: UUID;
    readonly action: AuditAction;
    readonly previousHash: string | null;
    readonly recordHash: string;
}
export type AuditRecordCreatedEvent = OpseraEvent<AuditRecordCreatedPayload>;
//# sourceMappingURL=audit.events.d.ts.map