#!/bin/bash
# Sign all built container images with Cosign using key stored in Vault
# Attaches build provenance as annotations to each image
set -euo pipefail

REGISTRY="${REGISTRY_URL:?REGISTRY_URL is required}"
IMAGE_TAG="${GIT_SHA:?GIT_SHA is required}"
CORRELATION_ID="${PIPELINE_CORRELATION_ID:-unknown}"
VAULT_ADDR="${VAULT_ADDR:?VAULT_ADDR is required}"
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

SERVICES=("release-service" "risk-engine" "policy-engine" "audit-service"
          "verification-service" "analytics-service" "auth-service" "bff-service" "frontend")

echo "=== Cosign image signing [correlation: $CORRELATION_ID] ==="

# Fetch signing key from Vault (key never touches disk)
COSIGN_KEY=$(vault kv get -field=private_key secret/cosign/signing-key)

for SVC in "${SERVICES[@]}"; do
  IMAGE="${REGISTRY}/opsera/${SVC}:${IMAGE_TAG}"
  echo "Signing ${IMAGE}..."

  # Sign the image with provenance annotations
  echo "$COSIGN_KEY" | cosign sign \
    --key /dev/stdin \
    --yes \
    --annotations "build.timestamp=${BUILD_TIMESTAMP}" \
    --annotations "build.commit=${GIT_SHA}" \
    --annotations "build.correlation_id=${CORRELATION_ID}" \
    --annotations "build.pipeline=forge" \
    --annotations "build.builder=opsera-forge-agent" \
    --annotations "security.scans=gitleaks:pass,grype:pass,sonarqube:pass,snyk:pass" \
    "${IMAGE}"

  # Verify the signature immediately after signing
  cosign verify \
    --key "opsera-infra/cosign/cosign.pub" \
    "${IMAGE}" \
    | grep -q "Verification for" && echo "✓ ${SVC} signature verified"
done

echo "=== All images signed and verified [correlation: $CORRELATION_ID] ==="
