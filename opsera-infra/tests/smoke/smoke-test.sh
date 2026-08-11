#!/bin/bash
# Smoke test: verify all services return 200 from /health endpoint
set -euo pipefail

BASE_URL="${BASE_URL:?BASE_URL is required (e.g. http://opsera.dev.internal)}"
RETRIES="${RETRIES:-5}"
RETRY_DELAY="${RETRY_DELAY:-10}"

SERVICES=(
  "release-service"
  "risk-engine"
  "policy-engine"
  "audit-service"
  "verification-service"
  "analytics-service"
  "auth-service"
  "bff-service"
)

FAIL=0

for SVC in "${SERVICES[@]}"; do
  for i in $(seq 1 $RETRIES); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/internal/${SVC}/health" --max-time 10 || echo "000")
    if [ "$STATUS" = "200" ]; then
      echo "✓ ${SVC} healthy"
      break
    fi
    if [ "$i" -eq "$RETRIES" ]; then
      echo "✗ ${SVC} FAILED (status: ${STATUS}) after ${RETRIES} retries"
      FAIL=1
    else
      echo "  ${SVC} not ready (${STATUS}), retry ${i}/${RETRIES}..."
      sleep "$RETRY_DELAY"
    fi
  done
done

[ "$FAIL" -eq 0 ] && echo "=== All smoke tests PASSED ===" || { echo "=== Smoke tests FAILED ==="; exit 1; }
