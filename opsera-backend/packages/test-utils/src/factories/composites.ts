import { buildRelease, buildChange } from './release.factory.js';
import { buildRiskAssessment, buildRiskFinding } from './risk-assessment.factory.js';
import { buildPolicyRule, buildPolicyEvaluation } from './policy.factory.js';
import { buildAuditChain } from './audit-record.factory.js';

export interface ReleaseWithAssessment {
  release: ReturnType<typeof buildRelease>;
  changes: ReturnType<typeof buildChange>[];
  assessment: ReturnType<typeof buildRiskAssessment>;
  findings: ReturnType<typeof buildRiskFinding>[];
  policyEvaluations: ReturnType<typeof buildPolicyEvaluation>[];
  auditRecords: ReturnType<typeof buildAuditChain>;
}

/**
 * Builds a complete release object graph with valid referential integrity and hash chain.
 * Used by integration and E2E tests that need realistic data.
 */
export function createReleaseWithAssessment(
  overrides: { riskScore?: number; policyResult?: 'Pass' | 'Fail' | 'Warning' } = {},
): ReleaseWithAssessment {
  const release = buildRelease({ status: 'Analyzed' });
  const changes = [
    buildChange(release.id),
    buildChange(release.id),
    buildChange(release.id),
  ];

  const riskScore = overrides.riskScore ?? 35;
  const assessment = buildRiskAssessment(release.id, {
    risk_score: riskScore,
    risk_level: riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low',
    recommendation: riskScore >= 70 ? 'NO_GO' : 'GO',
  });

  const findings = [
    buildRiskFinding(assessment.id, { severity: 'Critical' }),
    buildRiskFinding(assessment.id, { severity: 'High' }),
    buildRiskFinding(assessment.id, { severity: 'Medium' }),
    buildRiskFinding(assessment.id, { severity: 'Low' }),
  ];

  const rule1 = buildPolicyRule();
  const rule2 = buildPolicyRule({ severity_level: 'Blocking' });
  const policyEvaluations = [
    buildPolicyEvaluation(rule1.id, release.id, { result: overrides.policyResult ?? 'Pass' }),
    buildPolicyEvaluation(rule2.id, release.id, { result: 'Pass' }),
  ];

  const auditRecords = buildAuditChain(5, {
    resource_type: 'Release',
    resource_id: release.id,
  });

  return { release, changes, assessment, findings, policyEvaluations, auditRecords };
}
