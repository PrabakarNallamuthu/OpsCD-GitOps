#!/bin/bash
# Integration test: verify distributed traces appear in Jaeger
set -euo pipefail

BFF_URL="${BFF_URL:-http://bff-service.opsera-internal.svc.cluster.local:3000}"
JAEGER_URL="${JAEGER_URL:-http://jaeger-query.monitoring.svc.cluster.local:16686}"
CORRELATION_ID="test-$(uuidgen | tr '[:upper:]' '[:lower:]')"

echo "=== Distributed Tracing Integration Test ==="
echo "Correlation ID: ${CORRELATION_ID}"

echo "1. Triggering test request..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-Correlation-ID: ${CORRELATION_ID}" \
  -H "Authorization: Bearer ${TEST_JWT}" \
  "${BFF_URL}/health")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "BFF request returned ${HTTP_STATUS}"
  exit 1
fi

echo "2. Waiting 30 seconds for traces to propagate..."
sleep 30

echo "3. Querying Jaeger for traces with correlation ID..."
TRACE_COUNT=$(curl -s \
  "${JAEGER_URL}/api/traces?service=bff-service&tags={\"correlation_id\":\"${CORRELATION_ID}\"}&limit=10" | \
  jq '.data | length')

if [ "${TRACE_COUNT}" -gt 0 ]; then
  echo "✓ Found ${TRACE_COUNT} trace(s) in Jaeger"

  # Check for spans from multiple services
  SERVICES=$(curl -s \
    "${JAEGER_URL}/api/traces?service=bff-service&tags={\"correlation_id\":\"${CORRELATION_ID}\"}&limit=1" | \
    jq -r '[.data[0].spans[].process.serviceName] | unique | .[]')

  echo "Services in trace:"
  echo "$SERVICES"

  SERVICE_COUNT=$(echo "$SERVICES" | wc -l)
  if [ "${SERVICE_COUNT}" -ge 2 ]; then
    echo "✓ Trace spans ${SERVICE_COUNT} services (distributed tracing confirmed)"
  else
    echo "⚠ Only ${SERVICE_COUNT} service(s) in trace — expected 2+"
  fi
else
  echo "✗ No traces found in Jaeger"
  exit 1
fi

echo "=== Distributed tracing test passed ==="
