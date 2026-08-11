#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# docker-sign.sh — Sign an Opsera image with Cosign
#
# Usage:
#   COSIGN_KEY=/path/to/cosign.key ./scripts/docker-sign.sh <image-ref>
#
# Example:
#   COSIGN_KEY=./cosign.key ./scripts/docker-sign.sh opsera/release-service:abc1234
#
# Required environment variables:
#   COSIGN_KEY   — path to the Cosign private key (.key file)
#
# Optional:
#   COSIGN_PUB_KEY — path to the public key for post-sign verification
#                    (defaults to COSIGN_KEY with .key replaced by .pub)
#   GIT_SHA        — Git SHA to embed as annotation (defaults to HEAD)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

IMAGE_REF="${1:-}"
if [[ -z "$IMAGE_REF" ]]; then
  echo "ERROR: IMAGE_REF is required." >&2
  echo "Usage: COSIGN_KEY=/path/to/cosign.key $0 <image-ref>" >&2
  exit 1
fi

# ── Cosign key check ──────────────────────────────────────────────────────────
if [[ -z "${COSIGN_KEY:-}" ]]; then
  echo "WARNING: COSIGN_KEY environment variable not set — skipping image signing." >&2
  echo "  To sign, set COSIGN_KEY to the path of your Cosign private key and re-run." >&2
  exit 0
fi

if [[ ! -f "${COSIGN_KEY}" ]]; then
  echo "ERROR: Cosign key not found at: ${COSIGN_KEY}" >&2
  exit 1
fi

# ── Cosign availability check ─────────────────────────────────────────────────
if ! command -v cosign &>/dev/null; then
  echo "ERROR: cosign is not installed or not in PATH." >&2
  echo "  Install: https://docs.sigstore.dev/cosign/installation/" >&2
  exit 1
fi

# ── Derived values ─────────────────────────────────────────────────────────────
GIT_SHA="${GIT_SHA:-$(git rev-parse HEAD 2>/dev/null || echo "unknown")}"
COSIGN_PUB_KEY="${COSIGN_PUB_KEY:-${COSIGN_KEY%.key}.pub}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Signing image with Cosign"
echo "   Image   : ${IMAGE_REF}"
echo "   Key     : ${COSIGN_KEY}"
echo "   Git SHA : ${GIT_SHA}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Sign ──────────────────────────────────────────────────────────────────────
# COSIGN_PASSWORD is read from environment or prompted interactively
cosign sign \
  --key "${COSIGN_KEY}" \
  --annotations "git_sha=${GIT_SHA}" \
  --annotations "org.opencontainers.image.revision=${GIT_SHA}" \
  --yes \
  "${IMAGE_REF}"

echo "✓ Image signed: ${IMAGE_REF}"

# ── Verify (if public key is available) ───────────────────────────────────────
if [[ -f "${COSIGN_PUB_KEY}" ]]; then
  echo ""
  echo "Verifying signature..."
  cosign verify \
    --key "${COSIGN_PUB_KEY}" \
    "${IMAGE_REF}" | jq '.[0] | {subject: .optional.subject, git_sha: .optional.git_sha}'
  echo "✓ Signature verified."
else
  echo ""
  echo "NOTE: Public key not found at '${COSIGN_PUB_KEY}' — skipping verification." >&2
  echo "  To verify: cosign verify --key <pub-key> ${IMAGE_REF}"
fi
