import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';
export declare const VERIFICATION_EVENT_TYPES: {
    readonly REQUESTED: "opsera.verification.requested";
    readonly COMPLETED: "opsera.verification.completed";
    readonly FAILED: "opsera.verification.failed";
};
export declare enum VerificationVerdict {
    PASS = "PASS",
    FAIL = "FAIL",
    INCONCLUSIVE = "INCONCLUSIVE"
}
export interface VerificationCompletedPayload {
    readonly releaseId: UUID;
    readonly verificationId: UUID;
    readonly verdict: VerificationVerdict;
    readonly anomaliesDetected: number;
    readonly durationMs: number;
}
export type VerificationCompletedEvent = OpseraEvent<VerificationCompletedPayload>;
//# sourceMappingURL=verification.events.d.ts.map