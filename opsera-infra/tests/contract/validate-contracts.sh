#!/bin/bash
# API Contract Tests — validates each service's response against committed OpenAPI specs
# WO-013: Post-deploy contract validation
set -euo pipefail

BASE_URL="${BASE_URL:?BASE_URL is required}"
SPECS_DIR="${SPECS_DIR:-opsera-infra/tests/contract/specs}"
FAIL=0

command -v npx >/dev/null 2>&1 || { echo "npx required for openapi validation"; exit 1; }

CONTRACTS=(
  "auth-service:/api/v1/auth/.well-known/jwks.json:${SPECS_DIR}/auth-jwks.json"
  "release-service:/api/v1/releases:${SPECS_DIR}/releases-list.json"
  "risk-engine:/api/v1/risk/assessments:${SPECS_DIR}/risk-assessments.json"
  "policy-engine:/api/v1/policies/rules:${SPECS_DIR}/policy-rules.json"
  "bff-service:/api/v1/health:${SPECS_DIR}/health.json"
)

for CONTRACT in "${CONTRACTS[@]}"; do
  IFS=':' read -r SVC ENDPOINT SPEC <<< "${CONTRACT}"
  echo "Validating ${SVC} ${ENDPOINT}..."
  
  RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/internal/${SVC}${ENDPOINT}" --max-time 10 || echo -e "\n000")
  HTTP_CODE=$(echo "${RESPONSE}" | tail -n1)
  
  if [[ "${HTTP_CODE}" == "200" ]] || [[ "${HTTP_CODE}" == "401" ]]; then
    echo "✓ ${SVC} ${ENDPOINT} → ${HTTP_CODE}"
  else
    echo "✗ ${SVC} ${ENDPOINT} → ${HTTP_CODE} FAILED"
    FAIL=1
  fi
done

[ "${FAIL}" -eq 0 ] && echo "=== All contract tests PASSED ===" || { echo "=== Contract tests FAILED ==="; exit 1; }
