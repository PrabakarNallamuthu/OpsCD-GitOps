#!/bin/bash
# Automated PostgreSQL PITR restore script
# Usage: bash postgresql-restore.sh <backup-date> <target-timestamp> <namespace>
# Example: bash postgresql-restore.sh 20260101 "2026-01-01 10:00:00+00" opsera-internal
set -euo pipefail

BACKUP_DATE="${1:?Usage: $0 <backup-date YYYYMMDD> <target-timestamp> <namespace>}"
TARGET_TIMESTAMP="${2:?target timestamp required (e.g. '2026-01-01 10:00:00+00')}"
NAMESPACE="${3:-opsera-internal}"
MINIO_BUCKET="${MINIO_BUCKET:-opsera-backups}"
RESTORE_LOG="/tmp/postgresql-restore-$(date +%s).log"

echo "=== PostgreSQL PITR Restore ===" | tee "$RESTORE_LOG"
echo "Backup date:    $BACKUP_DATE"    | tee -a "$RESTORE_LOG"
echo "Target time:    $TARGET_TIMESTAMP" | tee -a "$RESTORE_LOG"
echo "Namespace:      $NAMESPACE"       | tee -a "$RESTORE_LOG"

# Pre-restoration validation
echo "--- Pre-restoration validation ---" | tee -a "$RESTORE_LOG"
mc ls "${MINIO_BUCKET}/base/${BACKUP_DATE}/" || { echo "FAIL: backup not found"; exit 1; }
echo "✓ Backup found in MinIO" | tee -a "$RESTORE_LOG"

# Stop application services
echo "--- Scaling down application services ---" | tee -a "$RESTORE_LOG"
kubectl scale deploy --replicas=0 -n "$NAMESPACE" --all 2>&1 | tee -a "$RESTORE_LOG"
echo "✓ Services scaled to 0" | tee -a "$RESTORE_LOG"

# Restore base backup via kubectl exec
echo "--- Restoring base backup ---" | tee -a "$RESTORE_LOG"
PG_POD=$(kubectl get pod -n opsera-data -l app=postgresql-primary -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n opsera-data "$PG_POD" -- bash -c "
  pg_ctl stop -D /var/lib/postgresql/data || true
  mc cp ${MINIO_BUCKET}/base/${BACKUP_DATE}/base.tar.gz /tmp/
  rm -rf /var/lib/postgresql/data/*
  tar -xzf /tmp/base.tar.gz -C /var/lib/postgresql/data/
  cat >> /var/lib/postgresql/data/postgresql.auto.conf <<EOF
restore_command = 'mc cp ${MINIO_BUCKET}/wal/%f %p'
recovery_target_time = '${TARGET_TIMESTAMP}'
recovery_target_action = 'promote'
EOF
  touch /var/lib/postgresql/data/recovery.signal
  pg_ctl start -D /var/lib/postgresql/data
" 2>&1 | tee -a "$RESTORE_LOG"

echo "Waiting 60s for PostgreSQL to recover..." | tee -a "$RESTORE_LOG"
sleep 60

# Post-restoration integrity checks
echo "--- Post-restoration integrity checks ---" | tee -a "$RESTORE_LOG"
kubectl exec -n opsera-data "$PG_POD" -- psql -U postgres opsera -c "
  SELECT 'audit_chain_integrity' AS check,
    (SELECT COUNT(*) FROM (
      SELECT previous_checksum, LAG(checksum) OVER (ORDER BY event_timestamp) AS prev_checksum
      FROM audit.records ORDER BY event_timestamp DESC LIMIT 1000
    ) t WHERE prev_checksum IS NOT NULL AND previous_checksum != prev_checksum) AS broken_links;
" 2>&1 | tee -a "$RESTORE_LOG"

echo "=== Restore complete. Review log: $RESTORE_LOG ===" | tee -a "$RESTORE_LOG"
cat "$RESTORE_LOG" | python3 -c "import sys,json; data=sys.stdin.read(); print(json.dumps({'status':'complete','log':data}))" > "/tmp/restore-result.json"
