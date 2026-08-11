#!/bin/bash
# Smoke test: verify all Prometheus targets are UP
set -euo pipefail

PROMETHEUS_URL="${PROMETHEUS_URL:-http://prometheus.monitoring.svc.cluster.local:9090}"

EXPECTED_JOBS=(
  "release-service"
  "risk-engine"
  "policy-engine"
  "audit-service"
  "verification-service"
  "analytics-service"
  "auth-service"
  "bff-service"
  "kafka-jmx"
  "postgres-exporter"
  "redis-exporter"
  "kube-state-metrics"
  "node-exporter"
)

echo "=== Prometheus Target Health Check ==="
failures=0

for JOB in "${EXPECTED_JOBS[@]}"; do
  RESULT=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=up{job=\"${JOB}\"}" | \
    jq -r '.data.result[0].value[1] // "missing"')

  if [ "$RESULT" = "1" ]; then
    echo "✓ ${JOB}: UP"
  else
    echo "✗ ${JOB}: ${RESULT}"
    failures=$((failures + 1))
  fi
done

echo ""
if [ $failures -eq 0 ]; then
  echo "All ${#EXPECTED_JOBS[@]} targets healthy"
  exit 0
else
  echo "${failures} target(s) failed"
  exit 1
fi
