#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# docker-build.sh — Build the Opsera frontend image
#
# Usage:
#   ./scripts/docker-build.sh [registry]
#
# Example:
#   ./scripts/docker-build.sh ghcr.io/opsera-io
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REGISTRY="${1:-${REGISTRY:-opsera}}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

GIT_SHA="${GIT_SHA:-$(git -C "${REPO_ROOT}" rev-parse HEAD 2>/dev/null || echo "unknown")}"
GIT_SHA_SHORT="${GIT_SHA:0:12}"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
SEMVER="${SEMVER:-$(node -p "require('${REPO_ROOT}/package.json').version" 2>/dev/null || echo "0.0.0")}"

IMAGE_NAME="${REGISTRY}/opsera-frontend"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Building Opsera frontend image"
echo "   Image     : ${IMAGE_NAME}"
echo "   Git SHA   : ${GIT_SHA_SHORT}"
echo "   SemVer    : ${SEMVER}"
echo "   Timestamp : ${BUILD_TIMESTAMP}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker build \
  --file "${REPO_ROOT}/Dockerfile" \
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

IMAGE_SIZE_BYTES=$(docker image inspect "${IMAGE_NAME}:${GIT_SHA_SHORT}" \
  --format '{{.Size}}' 2>/dev/null || echo "0")
IMAGE_SIZE_MB=$(( IMAGE_SIZE_BYTES / 1024 / 1024 ))
echo ""
echo "Image size: ${IMAGE_SIZE_MB} MB (target: < 50 MB)"
if (( IMAGE_SIZE_MB > 50 )); then
  echo "WARNING: Frontend image exceeds 50 MB target!" >&2
fi
