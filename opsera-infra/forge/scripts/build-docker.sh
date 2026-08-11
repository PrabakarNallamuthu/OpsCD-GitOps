#!/bin/bash
# Build Docker images for all 9 Opsera services
set -euo pipefail

REGISTRY="${REGISTRY:-ghcr.io/opsera}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
SEMVER_TAG="${SEMVER_TAG:-dev}"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_SHA="${IMAGE_TAG}"

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

echo "=== Building Docker images ==="
echo "Registry: ${REGISTRY}"
echo "Tag:      ${IMAGE_TAG}"
echo "SemVer:   ${SEMVER_TAG}"

build_service() {
  local SERVICE="$1"
  echo "[${SERVICE}] Building..."
  docker build \
    --file opsera-backend/docker/Dockerfile.service \
    --build-arg SERVICE_NAME="${SERVICE}" \
    --build-arg BUILD_DATE="${BUILD_DATE}" \
    --build-arg GIT_SHA="${GIT_SHA}" \
    --label "org.opencontainers.image.created=${BUILD_DATE}" \
    --label "org.opencontainers.image.revision=${GIT_SHA}" \
    --label "org.opencontainers.image.title=${SERVICE}" \
    --label "org.opencontainers.image.vendor=Opsera" \
    --tag "${REGISTRY}/${SERVICE}:${IMAGE_TAG}" \
    --tag "${REGISTRY}/${SERVICE}:${SEMVER_TAG}" \
    --cache-from "${REGISTRY}/${SERVICE}:main" \
    --progress plain \
    opsera-backend/
  echo "[${SERVICE}] Done"
}

echo "=== Building React frontend ==="
docker build \
  --file opsera-frontend/Dockerfile \
  --build-arg BUILD_DATE="${BUILD_DATE}" \
  --build-arg GIT_SHA="${GIT_SHA}" \
  --label "org.opencontainers.image.created=${BUILD_DATE}" \
  --label "org.opencontainers.image.revision=${GIT_SHA}" \
  --label "org.opencontainers.image.title=web-app" \
  --tag "${REGISTRY}/web-app:${IMAGE_TAG}" \
  --tag "${REGISTRY}/web-app:${SEMVER_TAG}" \
  --cache-from "${REGISTRY}/web-app:main" \
  --progress plain \
  opsera-frontend/

echo "=== Building backend services in parallel ==="
pids=()
for SERVICE in "${SERVICES[@]}"; do
  build_service "${SERVICE}" &
  pids+=("$!")
done

# Wait for all and collect exit codes
failed=0
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    failed=1
  fi
done

if [ "$failed" -eq 1 ]; then
  echo "One or more Docker builds failed"
  exit 1
fi

echo "=== All images built successfully ==="
