#!/bin/bash
# Parallel security scanning: Gitleaks → Trivy/Grype → SonarQube → Snyk
# All four run in parallel; results aggregated and pipeline fails on any Critical/High
set -euo pipefail

SCAN_DIR="${1:-/workspace}"
OUTPUT_DIR="${2:-/scan-results}"
CORRELATION_ID="${PIPELINE_CORRELATION_ID:-unknown}"

mkdir -p "$OUTPUT_DIR"

echo "=== Starting parallel security scans [correlation: $CORRELATION_ID] ==="
FAIL=0

# ── 1. Secret Detection (Gitleaks) ───────────────────────────────────────────
run_gitleaks() {
  echo "[gitleaks] Scanning for secrets..."
  gitleaks detect \
    --source "$SCAN_DIR" \
    --config "$SCAN_DIR/opsera-infra/forge/config/.gitleaks.toml" \
    --report-format json \
    --report-path "$OUTPUT_DIR/gitleaks-results.json" \
    --no-git 2>&1 | tee "$OUTPUT_DIR/gitleaks.log"
  echo "[gitleaks] ✓ No secrets detected"
}

# ── 2. Container Image Vulnerability Scanning (Grype) ────────────────────────
run_grype() {
  echo "[grype] Scanning container images..."
  SERVICES=("release-service" "risk-engine" "policy-engine" "audit-service"
            "verification-service" "analytics-service" "auth-service" "bff-service" "frontend")
  REGISTRY="${REGISTRY_URL:-localhost:5000}"
  IMAGE_TAG="${GIT_SHA:-latest}"

  for SVC in "${SERVICES[@]}"; do
    IMAGE="${REGISTRY}/opsera/${SVC}:${IMAGE_TAG}"
    grype "$IMAGE" \
      --output sarif \
      --file "$OUTPUT_DIR/grype-${SVC}.sarif" \
      --fail-on critical 2>&1 | tee -a "$OUTPUT_DIR/grype.log"
  done
  echo "[grype] ✓ No critical CVEs found"
}

# ── 3. SAST (SonarQube) ──────────────────────────────────────────────────────
run_sonarqube() {
  echo "[sonarqube] Running static analysis..."
  sonar-scanner \
    -Dsonar.host.url="${SONAR_HOST_URL}" \
    -Dsonar.login="${SONAR_TOKEN}" \
    -Dsonar.projectKey="opsera-voyage" \
    -Dsonar.sources="$SCAN_DIR/opsera-backend/packages,$SCAN_DIR/opsera-frontend/src" \
    -Dsonar.exclusions="**/node_modules/**,**/*.spec.ts,**/dist/**" \
    -Dsonar.javascript.lcov.reportPaths="**/coverage/lcov.info" \
    -Dsonar.qualitygate.wait=true 2>&1 | tee "$OUTPUT_DIR/sonarqube.log"
  echo "[sonarqube] ✓ Quality gate passed"
}

# ── 4. Dependency Vulnerability Scanning (Snyk) ──────────────────────────────
run_snyk() {
  echo "[snyk] Scanning dependencies..."
  snyk test \
    --all-projects \
    --severity-threshold=high \
    --json-file-output="$OUTPUT_DIR/snyk-results.json" \
    --org="${SNYK_ORG}" 2>&1 | tee "$OUTPUT_DIR/snyk.log"
  echo "[snyk] ✓ No high/critical CVEs in dependencies"
}

# Run all four in parallel
run_gitleaks & PID_GITLEAKS=$!
run_grype    & PID_GRYPE=$!
run_sonarqube & PID_SONAR=$!
run_snyk     & PID_SNYK=$!

for PID SCANNER in "$PID_GITLEAKS" gitleaks "$PID_GRYPE" grype "$PID_SONAR" sonarqube "$PID_SNYK" snyk; do
  if ! wait "$PID"; then
    echo "❌ $SCANNER scan FAILED"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 1 ]; then
  echo "=== Security scan FAILED — pipeline blocked ==="
  # Notify Slack if webhook configured
  if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -s -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"🚨 *Security scan FAILED* for pipeline \`${CORRELATION_ID}\`. Check artifacts for details.\"}"
  fi
  exit 1
fi

echo "=== All security scans PASSED [correlation: $CORRELATION_ID] ==="
