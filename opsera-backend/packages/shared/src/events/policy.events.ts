import type { OpseraEvent } from './base-event.interface.js';
import type { UUID } from '../types/common.types.js';

export const POLICY_EVENT_TYPES = {
  EVALUATED: 'opsera.policy.evaluated',
  RULE_CREATED: 'opsera.policy.rule.created',
  RULE_UPDATED: 'opsera.policy.rule.updated',
  RULE_DELETED: 'opsera.policy.rule.deleted',
  VIOLATION_DETECTED: 'opsera.policy.violation.detected',
} as const;

export interface PolicyEvaluatedPayload {
  readonly releaseId: UUID;
  readonly policyId: UUID;
  readonly passed: boolean;
  readonly violatedRules: string[];
  readonly evaluationDurationMs: number;
}

export type PolicyEvaluatedEvent = OpseraEvent<PolicyEvaluatedPayload>;
