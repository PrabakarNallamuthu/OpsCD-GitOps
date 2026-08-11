# PostgreSQL Disaster Recovery

**RTO:** 4 hours | **RPO:** 1 hour

## Backup Configuration

### Continuous WAL Archiving (RPO: 1 hour)

WAL segments are archived to MinIO every 5 minutes via `archive_command` in `postgresql.conf`:

```
archive_mode = on
archive_command = 'mc cp %p minio/opsera-backups/wal/%f'
archive_timeout = 300
```

### Daily Full Backup

A CronJob runs `pg_basebackup` daily at 02:00 UTC:

```bash
pg_basebackup -h $DB_HOST -U postgres -D /backup/base -Ft -z -Xs --checkpoint=fast
mc cp /backup/base.tar.gz minio/opsera-backups/base/$(date +%Y%m%d)/
```

Retention: 30 days of full backups, 7 days of WAL segments.

## Point-in-Time Recovery (PITR)

Run this from a fresh PostgreSQL 16 pod:

```bash
# 1. Stop application services
kubectl scale deploy --replicas=0 -n opsera-internal --all

# 2. Restore base backup
mc cp minio/opsera-backups/base/20260101/base.tar.gz /var/lib/postgresql/data/
tar -xzf base.tar.gz -C /var/lib/postgresql/data/

# 3. Create recovery configuration
cat > /var/lib/postgresql/data/postgresql.auto.conf <<EOF
restore_command = 'mc cp minio/opsera-backups/wal/%f %p'
recovery_target_time = '2026-01-01 10:00:00+00'
recovery_target_action = 'promote'
EOF
touch /var/lib/postgresql/data/recovery.signal

# 4. Start PostgreSQL and wait for recovery
pg_ctl start -D /var/lib/postgresql/data
pg_ctl status # wait for "server is running"
```

## Post-Restoration Integrity Checks

```sql
-- Verify audit hash chain integrity (sample: last 1000 records)
SELECT COUNT(*) FROM (
  SELECT
    id,
    checksum,
    LAG(checksum) OVER (ORDER BY event_timestamp) AS prev,
    previous_checksum
  FROM audit.records
  ORDER BY event_timestamp DESC
  LIMIT 1000
) t WHERE t.prev IS NOT NULL AND t.previous_checksum != t.prev;
-- Expected result: 0 rows (chain intact)

-- Verify row counts across key tables
SELECT 'releases' AS tbl, COUNT(*) FROM release.releases
UNION ALL SELECT 'audit.records', COUNT(*) FROM audit.records
UNION ALL SELECT 'policy.rules', COUNT(*) FROM policy.rules;
```

## Scripts

See `scripts/dr/postgresql-restore.sh` for the automated restoration script.
