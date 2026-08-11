# Opsera Backend — Docker Build Guide

## Quick Start

### Build a service image locally

```bash
# From opsera-backend/ root
./scripts/docker-build.sh release-service

# With explicit tags
SERVICE_NAME=release-service SEMVER=1.0.0 ./scripts/docker-build.sh release-service
```

### Run a service locally

```bash
docker run --rm -p 3001:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  opsera/release-service:latest
```

### Health check

```bash
curl http://localhost:3001/health
# {"status":"ok","service":"release-service"}
```

---

## Image Architecture

### Multi-Stage Build (Dockerfile.service)

| Stage | Base | Purpose |
|-------|------|---------|
| `builder` | `node:22-slim` | Install deps, compile TypeScript, create pnpm deploy bundle |
| `production` | `gcr.io/distroless/nodejs22-debian12` | Minimal runtime — no shell, no package manager |

### Security Properties

- **Non-root**: Runs as UID 1000 (`node` user in distroless)
- **No shell**: Distroless base has no bash/sh — reduces attack surface
- **No package manager**: apt/npm not present in production image
- **Minimal layers**: Only compiled JS + production node_modules copied
- **OCI labels**: Full build provenance embedded in image metadata

### Image Size Targets

| Image | Target | How achieved |
|-------|--------|-------------|
| Backend service | < 200 MB | Distroless base (~50MB) + compiled JS + prod deps only |
| Frontend | < 50 MB | nginx-alpine (~10MB) + static assets |

---

## Cosign Image Signing

### Sign an image (requires COSIGN_KEY env var)

```bash
export COSIGN_KEY=/path/to/cosign.key
./scripts/docker-sign.sh opsera/release-service:abc1234
```

### Verify a signature (requires COSIGN_PUB_KEY env var)

```bash
export COSIGN_PUB_KEY=/path/to/cosign.pub
cosign verify --key "$COSIGN_PUB_KEY" opsera/release-service:abc1234
```

### Generate a new Cosign key pair (first-time setup)

```bash
cosign generate-key-pair
# Creates cosign.key (private) and cosign.pub (public)
# Store cosign.key in Vault / CI secrets — NEVER commit it
# cosign.pub can be committed to the repo for verification
```

---

## Forge Shipping Engine Integration

The Dockerfile is designed to work with the `build:docker` and `scan:grype` steps in Forge pipelines.

**Pipeline step config:**
```yaml
steps:
  - type: build:docker
    config:
      dockerfile: docker/Dockerfile.service
      buildArgs:
        SERVICE_NAME: "{{ service_name }}"
        GIT_SHA: "{{ git.sha }}"
        SEMVER: "{{ version }}"

  - type: scan:grype
    config:
      image: "{{ registry }}/{{ service_name }}:{{ git.sha }}"
      failOnSeverity: critical
```

---

## OCI Labels (Build Provenance)

Every image includes these labels, queryable via `docker inspect`:

```
org.opencontainers.image.title        = release-service
org.opencontainers.image.source       = https://github.com/opsera-io/opsera-voyage
org.opencontainers.image.revision     = abc1234def5678...  (full git SHA)
org.opencontainers.image.created      = 2026-08-11T08:00:00Z
org.opencontainers.image.version      = 1.0.0
org.opencontainers.image.vendor       = Opsera
```

Inspect labels:
```bash
docker inspect --format='{{json .Config.Labels}}' opsera/release-service:abc1234 | jq
```
