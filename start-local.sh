#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────────────────
# Opsera Voyage — Local Dev Launcher
# Starts: auth-service, release-service, risk-engine, policy-engine,
#         audit-service, analytics-service, bff, and frontend (Vite)
#
# Usage:
#   ./start-local.sh              # start all
#   ./start-local.sh auth         # start only auth-service
#   ./start-local.sh frontend     # start only frontend
# ───────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/opsera-backend"
FRONTEND="$ROOT/opsera-frontend"
LOGS="$ROOT/.local-logs"
mkdir -p "$LOGS"

# Load env vars
set -a
source "$ROOT/.env.local"
set +a

SWC_NODE="node -r @swc-node/register"
NODE_PATHS="--experimental-specifier-resolution=node"

# ─── Helper ───────────────────────────────────────────────────────────────────
start_service() {
  local name="$1"
  local dir="$2"
  local port="$3"
  local db_url="$4"

  echo "▶ Starting $name on port $port..."
  DATABASE_URL="$db_url" PORT="$port" \
    node \
      --require @swc-node/register \
      --experimental-specifier-resolution=node \
      "$dir/src/main.ts" \
    > "$LOGS/$name.log" 2>&1 &

  echo "$!" > "$LOGS/$name.pid"
  echo "  PID: $(cat "$LOGS/$name.pid")  Logs: $LOGS/$name.log"
}

start_frontend() {
  echo "▶ Starting frontend (Vite) on port 5173..."
  cd "$FRONTEND" && pnpm dev > "$LOGS/frontend.log" 2>&1 &
  echo "$!" > "$LOGS/frontend.pid"
  echo "  PID: $(cat "$LOGS/frontend.pid")  Logs: $LOGS/frontend.log"
}

stop_all() {
  echo "Stopping all services..."
  for pidfile in "$LOGS"/*.pid; do
    [ -f "$pidfile" ] && kill "$(cat "$pidfile")" 2>/dev/null && rm "$pidfile"
  done
}

# ─── Main ─────────────────────────────────────────────────────────────────────
FILTER="${1:-all}"

if [[ "$FILTER" == "stop" ]]; then
  stop_all; exit 0
fi

if [[ "$FILTER" == "all" || "$FILTER" == "auth" ]]; then
  start_service "auth-service" "$BACKEND/services/auth-service" "$AUTH_SERVICE_PORT" "$DATABASE_URL_AUTH"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "release" ]]; then
  start_service "release-service" "$BACKEND/services/release-service" "$RELEASE_SERVICE_PORT" "$DATABASE_URL_RELEASE"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "audit" ]]; then
  start_service "audit-service" "$BACKEND/services/audit-service" "$AUDIT_SERVICE_PORT" "$DATABASE_URL_AUDIT"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "analytics" ]]; then
  start_service "analytics-service" "$BACKEND/services/analytics-service" "$ANALYTICS_SERVICE_PORT" "$DATABASE_URL_ANALYTICS"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "risk" ]]; then
  start_service "risk-engine" "$BACKEND/services/risk-engine" "$RISK_ENGINE_PORT" "$DATABASE_URL_RISK"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "policy" ]]; then
  start_service "policy-engine" "$BACKEND/services/policy-engine" "$POLICY_ENGINE_PORT" "$DATABASE_URL_POLICY"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "bff" ]]; then
  start_service "bff" "$BACKEND/services/bff" "$BFF_PORT" "none"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "frontend" ]]; then
  start_frontend
fi

echo ""
echo "✅ Services started! Logs in $LOGS/"
echo ""
echo "  Auth service:     http://localhost:$AUTH_SERVICE_PORT/api/v1"
echo "  Release service:  http://localhost:$RELEASE_SERVICE_PORT/api/v1"
echo "  Audit service:    http://localhost:$AUDIT_SERVICE_PORT/api/v1"
echo "  Risk engine:      http://localhost:$RISK_ENGINE_PORT/api/v1"
echo "  Policy engine:    http://localhost:$POLICY_ENGINE_PORT/api/v1"
echo "  Analytics:        http://localhost:$ANALYTICS_SERVICE_PORT/api/v1"
echo "  BFF:              http://localhost:$BFF_PORT/api/v1"
echo "  Frontend:         http://localhost:5173"
echo ""
echo "  Stop all:  ./start-local.sh stop"
echo "  View logs: tail -f $LOGS/<service>.log"
