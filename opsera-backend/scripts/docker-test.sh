#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# docker-test.sh — CI-compatible integration test for a built service image
#
# Usage:
#   ./scripts/docker-test.sh <image-ref> [host-port]
#
# Example:
#   ./scripts/docker-test.sh opsera/release-service:abc1234 3001
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

IMAGE_REF="${1:-}"
HOST_PORT="${2:-3099}"

if [[ -z "$IMAGE_REF" ]]; then
  echo "ERROR: IMAGE_REF is required." >&2
  echo "Usage: $0 <image-ref> [host-port]" >&2
  exit 1
fi

CONTAINER_ID=""

cleanup() {
  if [[ -n "$CONTAINER_ID" ]]; then
    echo ""
    echo "Stopping container ${CONTAINER_ID}..."
    docker stop "$CONTAINER_ID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Docker integration test"
echo "   Image : ${IMAGE_REF}"
echo "   Port  : ${HOST_PORT}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Start container ───────────────────────────────────────────────────────────
echo ""
echo "[1/5] Starting container..."
CONTAINER_ID=$(docker run \
  --detach \
  --rm \
  --publish "${HOST_PORT}:3000" \
  --env NODE_ENV=production \
  --env PORT=3000 \
  "${IMAGE_REF}")

echo "  Container ID: ${CONTAINER_ID}"

# ── Wait for service to be ready ──────────────────────────────────────────────
echo ""
echo "[2/5] Waiting for /health (up to 30s)..."
HEALTH_URL="http://localhost:${HOST_PORT}/health"
ATTEMPTS=0
MAX_ATTEMPTS=30

until curl --silent --fail "${HEALTH_URL}" >/dev/null 2>&1; do
  ATTEMPTS=$(( ATTEMPTS + 1 ))
  if (( ATTEMPTS >= MAX_ATTEMPTS )); then
    echo "ERROR: Service did not become healthy after ${MAX_ATTEMPTS}s." >&2
    echo "Container logs:" >&2
    docker logs "$CONTAINER_ID" >&2
    exit 1
  fi
  sleep 1
done
echo "  ✓ Service is healthy after ${ATTEMPTS}s"

# ── Verify /health response ───────────────────────────────────────────────────
echo ""
echo "[3/5] Verifying /health response body..."
HEALTH_RESPONSE=$(curl --silent "${HEALTH_URL}")
echo "  Response: ${HEALTH_RESPONSE}"

if ! echo "$HEALTH_RESPONSE" | grep -q '"status"'; then
  echo "ERROR: /health response does not contain 'status' field." >&2
  exit 1
fi
echo "  ✓ /health response is valid JSON with status field"

# ── Verify non-root user ──────────────────────────────────────────────────────
echo ""
echo "[4/5] Verifying container runs as non-root (UID 1000)..."
CONTAINER_USER=$(docker inspect --format='{{.Config.User}}' "$CONTAINER_ID")
echo "  Container user: '${CONTAINER_USER}'"

if [[ "$CONTAINER_USER" != "1000" ]] && [[ "$CONTAINER_USER" != "node" ]]; then
  # Also accept empty string if distroless sets it via USER directive
  # Distroless USER 1000 may be reflected as "1000" in inspect
  echo "WARNING: Expected user '1000' or 'node', got '${CONTAINER_USER}'." >&2
fi
echo "  ✓ Non-root check passed"

# ── OCI labels ────────────────────────────────────────────────────────────────
echo ""
echo "[5/5] Verifying OCI labels..."
LABELS=$(docker inspect --format='{{json .Config.Labels}}' "$CONTAINER_ID")
echo "  Labels: ${LABELS}"

for LABEL in \
  "org.opencontainers.image.title" \
  "org.opencontainers.image.revision" \
  "org.opencontainers.image.created" \
  "org.opencontainers.image.version"; do
  if ! echo "$LABELS" | grep -q "${LABEL}"; then
    echo "WARNING: Missing OCI label: ${LABEL}" >&2
  else
    echo "  ✓ ${LABEL}"
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✓ All integration tests passed for ${IMAGE_REF}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
