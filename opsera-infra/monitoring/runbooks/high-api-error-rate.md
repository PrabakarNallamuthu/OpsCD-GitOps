# Runbook: High API Error Rate

## Alert: HighAPIErrorRate / CriticalAPIErrorRate

**SLO:** Error rate < 0.5% (warning) / < 1% (critical) over 5 minutes

## Investigation Steps

1. **Identify the affected service:**
   ```bash
   kubectl get pods -n opsera-internal -l app=<service>
   kubectl logs -n opsera-internal deploy/<service> --tail=100
   ```

2. **Check recent deployments:**
   ```bash
   helm history <release-name> -n opsera-internal
   ```

3. **Check Kafka consumer lag (may cause timeouts):**
   ```bash
   kubectl exec -n opsera-kafka opsera-kafka-kafka-0 -- \
     kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --all-groups
   ```

4. **Check PostgreSQL connections:**
   ```sql
   SELECT count(*), state FROM pg_stat_activity GROUP BY state;
   ```

## Remediation

- **Deployment-related:** Roll back with `helm rollback <release-name>`
- **Database overload:** Scale down non-critical services, increase PgBouncer pool
- **Kafka lag:** Check DLQ, restart consumer pods

## Escalation

Critical severity → PagerDuty on-call → `#platform-incidents` Slack channel
