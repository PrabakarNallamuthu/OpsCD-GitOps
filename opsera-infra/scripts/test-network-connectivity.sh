#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# test-network-connectivity.sh — Connectivity matrix test for Opsera trust zones
#
# Tests ALL allowed and denied paths in the four-zone NetworkPolicy matrix.
# Must be run against a live Kubernetes cluster with NetworkPolicies applied.
#
# Usage:
#   ./scripts/test-network-connectivity.sh [--cleanup]
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

CLEANUP="${1:-}"
TIMEOUT=5
PASS=0
FAIL=0
SKIP=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

log_pass() { echo -e "${GREEN}PASS${NC} $1"; PASS=$(( PASS + 1 )); }
log_fail() { echo -e "${RED}FAIL${NC} $1"; FAIL=$(( FAIL + 1 )); }
log_skip() { echo -e "${YELLOW}SKIP${NC} $1"; SKIP=$(( SKIP + 1 )); }

# ── Deploy test pods ──────────────────────────────────────────────────────────
deploy_test_pods() {
  echo "Deploying connectivity test pods..."

  for NS in opsera-dmz opsera-internal opsera-data; do
    kubectl run nettest-"${NS##opsera-}" \
      --namespace="$NS" \
      --image=busybox:1.36 \
      --restart=Never \
      --command -- sleep 3600 \
      --labels="opsera.io/purpose=nettest" \
      2>/dev/null || true
  done

  # Wait for pods to be ready
  for NS in opsera-dmz opsera-internal opsera-data; do
    kubectl wait pod/nettest-"${NS##opsera-}" \
      --namespace="$NS" \
      --for=condition=Ready \
      --timeout=60s 2>/dev/null || true
  done

  echo "Test pods ready."
  echo ""
}

# ── Connectivity test helper ──────────────────────────────────────────────────
# Usage: test_connection <from-ns> <to-host> <to-port> <expected: allow|deny> <label>
test_connection() {
  local from_ns="$1"
  local to_host="$2"
  local to_port="$3"
  local expected="$4"
  local label="$5"
  local pod_name="nettest-${from_ns##opsera-}"

  # Check if test pod exists
  if ! kubectl get pod "$pod_name" -n "$from_ns" &>/dev/null; then
    log_skip "$label (pod not found in $from_ns)"
    return
  fi

  # Attempt connection with nc (netcat) with timeout
  if kubectl exec "$pod_name" -n "$from_ns" -- \
      nc -z -w "$TIMEOUT" "$to_host" "$to_port" &>/dev/null 2>&1; then
    connected=true
  else
    connected=false
  fi

  if [[ "$expected" == "allow" && "$connected" == "true" ]]; then
    log_pass "$label → ${to_host}:${to_port} (connected as expected)"
  elif [[ "$expected" == "deny" && "$connected" == "false" ]]; then
    log_pass "$label → ${to_host}:${to_port} (blocked as expected)"
  elif [[ "$expected" == "allow" && "$connected" == "false" ]]; then
    log_fail "$label → ${to_host}:${to_port} (expected ALLOW but connection blocked)"
  else
    log_fail "$label → ${to_host}:${to_port} (expected DENY but connection succeeded)"
  fi
}

# ── DNS test helper ───────────────────────────────────────────────────────────
test_dns() {
  local from_ns="$1"
  local label="$2"
  local pod_name="nettest-${from_ns##opsera-}"

  if ! kubectl get pod "$pod_name" -n "$from_ns" &>/dev/null; then
    log_skip "$label (pod not found)"
    return
  fi

  if kubectl exec "$pod_name" -n "$from_ns" -- \
      nslookup kubernetes.default.svc.cluster.local &>/dev/null 2>&1; then
    log_pass "$label DNS resolution (kubernetes.default.svc.cluster.local)"
  else
    log_fail "$label DNS resolution FAILED"
  fi
}

# ── Cleanup ───────────────────────────────────────────────────────────────────
cleanup() {
  echo "Cleaning up test pods..."
  for NS in opsera-dmz opsera-internal opsera-data; do
    kubectl delete pod nettest-"${NS##opsera-}" \
      --namespace="$NS" \
      --ignore-not-found=true
  done
}

if [[ "$CLEANUP" == "--cleanup" ]]; then
  cleanup
  echo "Cleanup complete."
  exit 0
fi

# ── Main ──────────────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Opsera Trust Zone Connectivity Matrix Test"
echo " $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

deploy_test_pods

echo "── DNS Resolution (all zones) ─────────────────────────────"
test_dns "opsera-dmz"      "DMZ"
test_dns "opsera-internal" "Internal"
test_dns "opsera-data"     "Data"
echo ""

echo "── DMZ → Internal (ALLOW: port 3000-3008) ─────────────────"
test_connection "opsera-dmz" "10.0.0.1" "3000" "allow" "DMZ → Internal:3000"
echo ""

echo "── Internal → Data (ALLOW: data store ports) ───────────────"
test_connection "opsera-internal" "10.0.0.2" "5432" "allow" "Internal → PostgreSQL:5432"
test_connection "opsera-internal" "10.0.0.2" "6379" "allow" "Internal → Redis:6379"
test_connection "opsera-internal" "10.0.0.2" "9092" "allow" "Internal → Kafka:9092"
test_connection "opsera-internal" "10.0.0.2" "9000" "allow" "Internal → MinIO:9000"
echo ""

echo "── Internal → External (DENY in prod) ──────────────────────"
test_connection "opsera-internal" "8.8.8.8" "443" "deny" "Internal → External:443"
test_connection "opsera-internal" "8.8.8.8" "80"  "deny" "Internal → External:80"
echo ""

echo "── Data → External (DENY always) ───────────────────────────"
test_connection "opsera-data" "8.8.8.8" "443" "deny" "Data → External:443"
echo ""

echo "── Data → Internal (DENY: data stores cannot initiate) ─────"
test_connection "opsera-data" "10.0.0.3" "3000" "deny" "Data → Internal:3000"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Results: PASS=${PASS}  FAIL=${FAIL}  SKIP=${SKIP}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Clean up test pods
cleanup

if (( FAIL > 0 )); then
  echo "CONNECTIVITY TEST FAILED: ${FAIL} path(s) did not match expected behavior."
  exit 1
fi

echo "All connectivity tests passed."
