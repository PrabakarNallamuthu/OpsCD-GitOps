import { randomUUID } from 'crypto';

export type PolicySeverity = 'Blocking' | 'Warning' | 'Info';
export type EvaluationResult = 'Pass' | 'Fail' | 'Warning';

export interface PolicyRuleFactory {
  id: string;
  name: string;
  description: string;
  condition_expression: string;
  severity_level: PolicySeverity;
  version: number;
  compliance_frameworks: string[];
  org_id: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface PolicyEvaluationFactory {
  id: string;
  rule_id: string;
  rule_version: number;
  release_id: string;
  result: EvaluationResult;
  message: string;
  input_context: Record<string, unknown>;
  evaluated_at: Date;
}

let ruleSeq = 1;

export function buildPolicyRule(overrides: Partial<PolicyRuleFactory> = {}): PolicyRuleFactory {
  const seq = ruleSeq++;
  return {
    id: randomUUID(),
    name: `Policy Rule ${seq}`,
    description: `Automated policy rule ${seq}`,
    condition_expression: `context.risk_score < 70 && context.test_coverage >= 80`,
    severity_level: 'Warning',
    version: 1,
    compliance_frameworks: ['SOC2', 'PCI-DSS'],
    org_id: '00000000-0000-0000-0000-000000000000',
    created_by: randomUUID(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

export function buildPolicyEvaluation(
  ruleId: string,
  releaseId: string,
  overrides: Partial<PolicyEvaluationFactory> = {},
): PolicyEvaluationFactory {
  return {
    id: randomUUID(),
    rule_id: ruleId,
    rule_version: 1,
    release_id: releaseId,
    result: 'Pass',
    message: 'Policy evaluation passed',
    input_context: { risk_score: 30, test_coverage: 85 },
    evaluated_at: new Date(),
    ...overrides,
  };
}
