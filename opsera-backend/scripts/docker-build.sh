#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# docker-build.sh — Build a tagged Opsera backend service image
#
# Usage:
#   ./scripts/docker-build.sh <service-name> [registry]
#
# Examples:
#   ./scripts/docker-build.sh release-service
#   ./scripts/docker-build.sh risk-engine ghcr.io/opsera-io
#
# Environment overrides:
#   SEMVER       — override the semver tag (defaults to service package.json .version)
#   GIT_SHA      — override the git SHA (defaults to git rev-parse HEAD)
#   NO_PUSH      — set to 1 to skip push (default: images are NOT pushed)
#   REGISTRY     — same as the optional positional arg
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Arguments ─────────────────────────────────────────────────────────────────
SERVICE_NAME="${1:-}"
if [[ -z "$SERVICE_NAME" ]]; then
  echo "ERROR: SERVICE_NAME is required." >&2
  echo "Usage: $0 <service-name> [registry]" >&2
  exit 1
fi

REGISTRY="${2:-${REGISTRY:-opsera}}"

# ── Derived values ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

GIT_SHA="${GIT_SHA:-$(git -C "${REPO_ROOT}" rev-parse HEAD 2>/dev/null || echo "unknown")}"
GIT_SHA_SHORT="${GIT_SHA:0:12}"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Read version from the service's package.json (fallback to 0.0.0)
SERVICE_PKG="${REPO_ROOT}/services/${SERVICE_NAME}/package.json"
if [[ ! -f "$SERVICE_PKG" ]]; then
  echo "ERROR: Service package not found: ${SERVICE_PKG}" >&2
  exit 1
fi
SEMVER="${SEMVER:-$(node -p "require('${SERVICE_PKG}').version" 2>/dev/null || echo "0.0.0")}"

IMAGE_NAME="${REGISTRY}/${SERVICE_NAME}"
DOCKERFILE="${REPO_ROOT}/docker/Dockerfile.service"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Building Opsera service image"
echo "   Service   : ${SERVICE_NAME}"
echo "   Registry  : ${REGISTRY}"
echo "   Image     : ${IMAGE_NAME}"
echo "   Git SHA   : ${GIT_SHA_SHORT} (${GIT_SHA})"
echo "   SemVer    : ${SEMVER}"
echo "   Timestamp : ${BUILD_TIMESTAMP}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Build ──────────────────────────────────────────────────────────────────────
docker build \
  --file "${DOCKERFILE}" \
  --build-arg SERVICE_NAME="${SERVICE_NAME}" \
  --build-arg GIT_SHA="${GIT_SHA}" \
  --build-arg SEMVER="${SEMVER}" \
  --build-arg BUILD_TIMESTAMP="${BUILD_TIMESTAMP}" \
  --tag "${IMAGE_NAME}:${GIT_SHA_SHORT}" \
  --tag "${IMAGE_NAME}:${SEMVER}" \
  --tag "${IMAGE_NAME}:latest" \
  "${REPO_ROOT}"

echo ""
echo "✓ Build complete. Tagged:"
echo "    ${IMAGE_NAME}:${GIT_SHA_SHORT}"
echo "    ${IMAGE_NAME}:${SEMVER}"
echo "    ${IMAGE_NAME}:latest"

# ── Size check ────────────────────────────────────────────────────────────────
IMAGE_SIZE_BYTES=$(docker image inspect "${IMAGE_NAME}:${GIT_SHA_SHORT}" \
  --format '{{.Size}}' 2>/dev/null || echo "0")
IMAGE_SIZE_MB=$(( IMAGE_SIZE_BYTES / 1024 / 1024 ))

echo ""
echo "Image size: ${IMAGE_SIZE_MB} MB (target: < 200 MB)"
if (( IMAGE_SIZE_MB > 200 )); then
  echo "WARNING: Image exceeds 200 MB size target!" >&2
fi

# ── OCI label verification ────────────────────────────────────────────────────
echo ""
echo "OCI labels:"
docker inspect --format='{{range $k,$v := .Config.Labels}}  {{$k}} = {{$v}}{{println}}{{end}}' \
  "${IMAGE_NAME}:${GIT_SHA_SHORT}"

echo ""
echo "Done. Run with: docker run --rm -p 3001:3000 ${IMAGE_NAME}:${GIT_SHA_SHORT}"
