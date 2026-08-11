#!/bin/bash
# Record approval decision as an immutable audit record
# WO-013: Approval Gate and Multi-Environment Deployment Stages
set -euo pipefail

AUDIT_SERVICE_URL="${AUDIT_SERVICE_URL:?AUDIT_SERVICE_URL required}"
APPROVER_ID="${APPROVER_ID:?APPROVER_ID required}"
APPROVER_EMAIL="${APPROVER_EMAIL:-unknown}"
APPROVAL_DECISION="${APPROVAL_DECISION:?APPROVAL_DECISION required}"
PIPELINE_CORRELATION_ID="${PIPELINE_CORRELATION_ID:?PIPELINE_CORRELATION_ID required}"
ENVIRONMENT="${ENVIRONMENT:-pre-deployment}"
GIT_SHA="${GIT_SHA:-$(git rev-parse HEAD 2>/dev/null || echo 'unknown')}"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

PAYLOAD=$(cat <<EOF
{
  "event_type": "pipeline.approval.decision",
  "actor_id": "${APPROVER_ID}",
  "actor_email": "${APPROVER_EMAIL}",
  "resource_type": "pipeline",
  "resource_id": "${PIPELINE_CORRELATION_ID}",
  "action": "approval.${APPROVAL_DECISION}",
  "payload": {
    "decision": "${APPROVAL_DECISION}",
    "environment": "${ENVIRONMENT}",
    "git_sha": "${GIT_SHA}",
    "pipeline_id": "${PIPELINE_CORRELATION_ID}",
    "timestamp": "${TIMESTAMP}"
  },
  "compliance_frameworks": ["SOX", "SOC2"],
  "correlation_id": "${PIPELINE_CORRELATION_ID}"
}
EOF
)

echo "Recording approval audit for pipeline ${PIPELINE_CORRELATION_ID}..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${AUDIT_SERVICE_URL}/internal/audit/records" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: ${INTERNAL_SECRET:-}" \
  -d "${PAYLOAD}" \
  --max-time 30)

HTTP_CODE=$(echo "${RESPONSE}" | tail -n1)
BODY=$(echo "${RESPONSE}" | head -n-1)

if [[ "${HTTP_CODE}" != "201" ]]; then
  echo "WARNING: Failed to record audit (HTTP ${HTTP_CODE}): ${BODY}"
  echo "Continuing pipeline — manual audit record required for compliance."
else
  echo "✓ Approval audit recorded: ${BODY}"
fi
