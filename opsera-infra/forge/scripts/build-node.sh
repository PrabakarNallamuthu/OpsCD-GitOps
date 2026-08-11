#!/bin/bash
# Build all NestJS services with TypeScript strict mode and run Jest with coverage
set -euo pipefail

SERVICES=(
  "services/release-service"
  "services/risk-engine"
  "services/policy-engine"
  "services/audit-service"
  "services/verification-service"
  "services/analytics-service"
  "services/auth-service"
  "services/bff-service"
)

echo "=== Installing dependencies ==="
pnpm install --frozen-lockfile

echo "=== Building shared packages ==="
pnpm --filter @opsera/shared build
pnpm --filter @opsera/logging build
pnpm --filter @opsera/kafka build

echo "=== TypeScript compilation (strict mode) ==="
pnpm run build 2>&1 | tee /tmp/build-output.log
if grep -q "error TS" /tmp/build-output.log; then
  echo "TypeScript compilation errors found"
  exit 1
fi

echo "=== Running Jest with 80% coverage gate ==="
pnpm jest \
  --ci \
  --coverage \
  --coverageReporters=lcov,text-summary,json \
  --forceExit \
  --detectOpenHandles \
  --maxWorkers=4 \
  --passWithNoTests

echo "=== Coverage validation ==="
# Jest exits non-zero if thresholds not met; this is a belt-and-suspenders check
COVERAGE_FILE="coverage/coverage-summary.json"
if [ -f "$COVERAGE_FILE" ]; then
  LINES=$(node -e "const c=require('./${COVERAGE_FILE}'); console.log(c.total.lines.pct)")
  echo "Line coverage: ${LINES}%"
  if (( $(echo "${LINES} < 80" | bc -l) )); then
    echo "Coverage ${LINES}% below threshold 80%"
    exit 1
  fi
fi

echo "=== Build and test complete ==="
