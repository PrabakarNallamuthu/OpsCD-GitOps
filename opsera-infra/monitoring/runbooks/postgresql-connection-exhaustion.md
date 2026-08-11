# Runbook: PostgreSQL Connection Exhaustion

## Alert: PostgreSQLConnectionWarning / PostgreSQLConnectionCritical

**Thresholds:** Warning >70% / Critical >80% of max_connections

## Investigation Steps

1. **Check current connection count:**
   ```sql
   SELECT count(*), state, wait_event_type, application_name
   FROM pg_stat_activity GROUP BY state, wait_event_type, application_name
   ORDER BY count DESC;
   ```

2. **Identify long-running queries holding connections:**
   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
   FROM pg_stat_activity
   WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '5 minutes';
   ```

3. **Check PgBouncer pool status:**
   ```bash
   kubectl exec -n opsera-internal deploy/pgbouncer -- psql -p 6432 -U pgbouncer pgbouncer -c "SHOW POOLS;"
   ```

## Remediation

- **Idle connections:** Terminate with `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='idle';`
- **Pool exhaustion:** Increase PgBouncer `pool_size` (max: 80% of pg max_connections / num_services)
- **Long-running queries:** Kill with `SELECT pg_cancel_backend(pid)`, investigate root cause

## Prevention

- PgBouncer transaction-mode pooling limits each service to `pool_size` real connections
- Configure `statement_timeout = 30s` and `idle_in_transaction_session_timeout = 60s`
