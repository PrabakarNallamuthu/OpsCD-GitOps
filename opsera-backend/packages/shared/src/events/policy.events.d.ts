import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';
export declare const POLICY_EVENT_TYPES: {
    readonly EVALUATED: "opsera.policy.evaluated";
    readonly RULE_CREATED: "opsera.policy.rule.created";
    readonly RULE_UPDATED: "opsera.policy.rule.updated";
    readonly RULE_DELETED: "opsera.policy.rule.deleted";
    readonly VIOLATION_DETECTED: "opsera.policy.violation.detected";
};
export interface PolicyEvaluatedPayload {
    readonly releaseId: UUID;
    readonly policyId: UUID;
    readonly passed: boolean;
    readonly violatedRules: string[];
    readonly evaluationDurationMs: number;
}
export type PolicyEvaluatedEvent = OpseraEvent<PolicyEvaluatedPayload>;
//# sourceMappingURL=policy.events.d.ts.map