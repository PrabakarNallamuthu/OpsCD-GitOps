# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# Opsera Frontend — Multi-stage Docker build
#
# Usage:
#   docker build \
#     --build-arg GIT_SHA=$(git rev-parse HEAD) \
#     --build-arg SEMVER=0.1.0 \
#     --build-arg BUILD_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
#     -t opsera/frontend:$(git rev-parse --short HEAD) \
#     .
# ─────────────────────────────────────────────────────────────────────────────

ARG GIT_SHA=unknown
ARG SEMVER=0.0.0
ARG BUILD_TIMESTAMP=unknown
ARG NODE_VERSION=22

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-slim AS builder

WORKDIR /build

# Copy manifests first for layer caching
COPY package.json package-lock.json* ./

# Install all deps (including devDependencies for build tooling)
RUN npm ci

# Copy source
COPY . .

# Build production assets
RUN npm run build

# ── Stage 2: Production (nginx) ───────────────────────────────────────────────
FROM nginx:1.27-alpine-slim AS production

ARG GIT_SHA
ARG SEMVER
ARG BUILD_TIMESTAMP

# OCI image spec labels for build provenance
LABEL org.opencontainers.image.title="opsera-frontend" \
      org.opencontainers.image.description="Opsera Voyage React frontend" \
      org.opencontainers.image.source="https://github.com/opsera-io/opsera-voyage" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.created="${BUILD_TIMESTAMP}" \
      org.opencontainers.image.version="${SEMVER}" \
      org.opencontainers.image.vendor="Opsera" \
      org.opencontainers.image.licenses="UNLICENSED"

# Remove default nginx html content
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets
COPY --from=builder /build/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create required temp dirs with correct ownership for nginx user
RUN mkdir -p /tmp/nginx_client_body /tmp/nginx_proxy /tmp/nginx_fastcgi \
             /tmp/nginx_uwsgi /tmp/nginx_scgi /var/log/nginx /var/run \
    && chown -R nginx:nginx /tmp/nginx_client_body /tmp/nginx_proxy \
         /tmp/nginx_fastcgi /tmp/nginx_uwsgi /tmp/nginx_scgi \
         /var/log/nginx /usr/share/nginx/html \
    && touch /tmp/nginx.pid && chown nginx:nginx /tmp/nginx.pid

EXPOSE 8080

# Run as non-root nginx user
USER nginx

CMD ["nginx", "-g", "daemon off;"]
