#!/bin/bash
# Run Prisma migrations for a specific service schema
# Usage: bash scripts/migrate.sh <service-name>
# Example: bash scripts/migrate.sh release-service
set -euo pipefail

SERVICE="${1:?Usage: $0 <service-name>}"
SCHEMA="${SERVICE//-/_}"   # release-service → release_service
SERVICE_DIR="${SERVICES_ROOT:-../../services}/${SERVICE}"

if [ ! -d "$SERVICE_DIR" ]; then
  echo "Service directory not found: $SERVICE_DIR"
  exit 1
fi

echo "=== Migrating schema '${SCHEMA}' for ${SERVICE} ==="

# Ensure schema exists
psql "${DATABASE_URL}" -c "CREATE SCHEMA IF NOT EXISTS ${SCHEMA};"

# Run Prisma migrations
pushd "$SERVICE_DIR" > /dev/null
DATABASE_URL="${DATABASE_URL}?schema=${SCHEMA}" npx prisma migrate deploy
popd > /dev/null

echo "=== Migration complete for ${SERVICE} ==="
