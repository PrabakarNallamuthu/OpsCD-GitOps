# Runbook: PostgreSQL Replication Lag

**Severity**: Critical  
**Alert**: `pg_replication_lag_seconds > 30`

## Diagnosis

```bash
# Connect to primary
kubectl exec -n opsera deploy/postgresql-primary -- \
  psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# Check replica lag
kubectl exec -n opsera deploy/postgresql-replica -- \
  psql -U postgres -c "SELECT now() - pg_last_xact_replay_timestamp() AS replication_delay;"

# Check WAL sender/receiver status
kubectl exec -n opsera deploy/postgresql-primary -- \
  psql -U postgres -c "SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn FROM pg_stat_replication;"
```

## Remediation

### High write load — throttle
```bash
# Check active long queries
kubectl exec -n opsera deploy/postgresql-primary -- \
  psql -U postgres -c "SELECT pid, now()-query_start, query FROM pg_stat_activity WHERE state='active' AND now()-query_start > interval '30s' ORDER BY query_start;"
```

### Network partition — verify connectivity
```bash
kubectl exec -n opsera deploy/postgresql-replica -- \
  pg_isready -h postgresql-primary -p 5432
```

### Replica fallen behind — rebuild
```bash
# Only if lag > 5 minutes and growing
kubectl exec -n opsera deploy/postgresql-replica -- \
  pg_basebackup -h postgresql-primary -U replicator -D /var/lib/postgresql/data --checkpoint=fast -P
```

## Escalation
- If lag > 5 minutes: page DBA on-call.
- If replica fails to reconnect within 15 minutes: promote replica to primary and initiate DR playbook.
