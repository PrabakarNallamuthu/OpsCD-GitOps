import { buildRelease } from '../factories/release.factory.js';
import { buildRiskAssessment, buildRiskFinding } from '../factories/risk-assessment.factory.js';
import { buildAuditRecord } from '../factories/audit-record.factory.js';

/** A release with no changes (should be blocked by guard). */
export const emptyRelease = buildRelease({ name: 'Empty Release', status: 'Draft' });

/** A risk assessment with maximum score and all-Critical findings. */
export const maxSeverityAssessment = buildRiskAssessment('release-uuid-fixture', {
  risk_score: 100,
  risk_level: 'Critical',
  recommendation: 'NO_GO',
  ai_summary: 'Maximum risk score — 100. All findings are Critical. Do not deploy.',
});

export const maxSeverityFindings = [1, 2, 3, 4].map(() =>
  buildRiskFinding(maxSeverityAssessment.id, {
    severity: 'Critical',
    resolution_status: 'Open',
  }),
);

/** An expired JWT token payload (for testing auth rejection). */
export const expiredJwt = {
  sub: '00000000-0000-0000-0000-000000000001',
  roles: ['Developer'],
  iat: Math.floor(Date.now() / 1000) - 7200,
  exp: Math.floor(Date.now() / 1000) - 3600,
};

/** A chain of audit records where the 3rd record is tampered (for negative testing). */
const validChain = [
  buildAuditRecord(undefined, { event_type: 'RELEASE_CREATED' }),
  buildAuditRecord('0'.repeat(64), { event_type: 'RELEASE_ANALYZING' }),
];
const tamperedRecord = {
  ...buildAuditRecord(validChain[1]?.checksum ?? '0'.repeat(64), { event_type: 'RELEASE_ANALYZED' }),
  payload: { tampered: true, injected: 'malicious' }, // payload changed after hashing
};
export const invalidHashChain = [...validChain, tamperedRecord];

/** A release blocked by a Blocking policy finding. */
export const blockedByPolicyRelease = buildRelease({
  name: 'Blocked Release',
  status: 'Analyzed',
});
