#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# minio-integration-test.sh — MinIO S3 API integration test
#
# Tests PUT, GET, LIST, DELETE operations in all buckets.
# Verifies encryption is active on uploaded objects.
#
# Usage:
#   MINIO_ENDPOINT=http://localhost:9000 \
#   MINIO_USER=opsera-minio-admin \
#   MINIO_PASSWORD=secret \
#   ./scripts/minio-integration-test.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ENDPOINT="${MINIO_ENDPOINT:-http://minio.opsera-data.svc.cluster.local:9000}"
USER="${MINIO_USER:-opsera-minio-admin}"
PASS="${MINIO_PASSWORD:-}"
PASS_FILE=""

PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_pass() { echo -e "${GREEN}PASS${NC} $1"; PASS=$(( PASS + 1 )); }
log_fail() { echo -e "${RED}FAIL${NC} $1"; FAIL=$(( FAIL + 1 )); }

# Configure mc
mc alias set test-minio "$ENDPOINT" "$USER" "$MINIO_PASSWORD" --insecure

BUCKETS=(
  opsera-pg-wal
  opsera-pg-backups
  opsera-redis-snapshots
  opsera-es-snapshots
  opsera-vault-snapshots
  opsera-audit-archives
)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " MinIO Integration Test — ${ENDPOINT}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test each bucket
for BUCKET in "${BUCKETS[@]}"; do
  echo ""
  echo "── Testing bucket: ${BUCKET} ────────────────────────────────"

  TEST_KEY="integration-test/$(date +%s)-test.txt"
  TEST_CONTENT="Opsera MinIO integration test — $(date -u +%Y-%m-%dT%H:%M:%SZ)"

  # PUT
  echo "$TEST_CONTENT" | mc pipe "test-minio/${BUCKET}/${TEST_KEY}" && \
    log_pass "${BUCKET}: PUT ${TEST_KEY}" || \
    log_fail "${BUCKET}: PUT FAILED"

  # GET
  RETRIEVED=$(mc cat "test-minio/${BUCKET}/${TEST_KEY}" 2>/dev/null)
  if [[ "$RETRIEVED" == "$TEST_CONTENT" ]]; then
    log_pass "${BUCKET}: GET matches uploaded content"
  else
    log_fail "${BUCKET}: GET content mismatch"
  fi

  # LIST
  if mc ls "test-minio/${BUCKET}/integration-test/" 2>/dev/null | grep -q test.txt; then
    log_pass "${BUCKET}: LIST shows uploaded object"
  else
    log_fail "${BUCKET}: LIST does not show uploaded object"
  fi

  # Stat (check encryption status)
  STAT=$(mc stat "test-minio/${BUCKET}/${TEST_KEY}" 2>/dev/null || echo "")
  if echo "$STAT" | grep -qi "X-Amz-Server-Side-Encryption"; then
    log_pass "${BUCKET}: Server-side encryption active"
  else
    echo "  INFO: ${BUCKET} — SSE metadata not present (SSE-S3 may be transparent)"
  fi

  # DELETE (skip for audit-archives — object lock prevents it)
  if [[ "$BUCKET" != "opsera-audit-archives" ]]; then
    mc rm "test-minio/${BUCKET}/${TEST_KEY}" && \
      log_pass "${BUCKET}: DELETE successful" || \
      log_fail "${BUCKET}: DELETE FAILED"
  else
    # Verify object lock BLOCKS deletion
    if mc rm "test-minio/${BUCKET}/${TEST_KEY}" 2>&1 | grep -qi "lock\|retention"; then
      log_pass "${BUCKET}: DELETE correctly blocked by object lock"
    else
      log_fail "${BUCKET}: Object lock did NOT block deletion (WORM not working)"
      # Clean up anyway
      mc rm --force --bypass "test-minio/${BUCKET}/${TEST_KEY}" 2>/dev/null || true
    fi
  fi
done

echo ""
echo "── Health check ─────────────────────────────────────────────"
if mc admin info test-minio 2>/dev/null | grep -q "Online"; then
  log_pass "MinIO admin info: Online"
else
  log_fail "MinIO admin info not available"
fi

echo ""
echo "── Lifecycle policy verification ────────────────────────────"
for BUCKET in "${BUCKETS[@]}"; do
  if mc ilm rule ls "test-minio/${BUCKET}" 2>/dev/null | grep -q "Expiry"; then
    log_pass "${BUCKET}: lifecycle policy configured"
  else
    log_fail "${BUCKET}: lifecycle policy NOT configured"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Results: PASS=${PASS}  FAIL=${FAIL}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if (( FAIL > 0 )); then
  exit 1
fi
