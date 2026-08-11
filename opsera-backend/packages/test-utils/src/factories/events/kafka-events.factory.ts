import { randomUUID } from 'crypto';

function eventEnvelope<T>(eventType: string, payload: T) {
  return {
    id: randomUUID(),
    type: eventType,
    source: 'opsera-platform',
    version: '1.0',
    correlation_id: randomUUID(),
    timestamp: new Date().toISOString(),
    payload,
  };
}

export function buildReleasesCreatedEvent(releaseId = randomUUID()) {
  return eventEnvelope('releases.created', {
    release_id: releaseId,
    name: 'Release 1.0',
    version: '1.0.0',
    status: 'Draft',
    environment_id: randomUUID(),
    created_by: randomUUID(),
    org_id: randomUUID(),
    change_count: 3,
  });
}

export function buildReleasesAnalysisRequestedEvent(releaseId = randomUUID()) {
  return eventEnvelope('releases.analysis_requested', {
    release_id: releaseId,
    requested_by: randomUUID(),
    change_count: 3,
  });
}

export function buildRiskAnalysisCompletedEvent(releaseId = randomUUID(), riskScore = 35) {
  return eventEnvelope('risk.analysis_completed', {
    release_id: releaseId,
    assessment_id: randomUUID(),
    risk_score: riskScore,
    risk_level: riskScore >= 70 ? 'High' : 'Low',
    recommendation: riskScore >= 70 ? 'NO_GO' : 'GO',
    finding_count: 4,
    duration_ms: 8500,
  });
}

export function buildPolicyEvaluatedEvent(releaseId = randomUUID()) {
  return eventEnvelope('policy.evaluated', {
    release_id: releaseId,
    evaluation_id: randomUUID(),
    rules_evaluated: 5,
    passed: 5,
    failed: 0,
    blocking_failures: 0,
    overall_result: 'Pass',
  });
}

export function buildAuditRecordCreatedEvent(resourceId = randomUUID()) {
  return eventEnvelope('audit.record_created', {
    record_id: randomUUID(),
    event_type: 'RELEASE_CREATED',
    actor_id: randomUUID(),
    resource_type: 'Release',
    resource_id: resourceId,
    action: 'CREATE',
  });
}
