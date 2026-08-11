# Runbook: Audit Trail Gap

## Alert: AuditTrailGap

**Threshold:** `audit_trail_discrepancy > 0` for 15 minutes
**Compliance Impact:** SOX non-compliance, SOC 2 CC7.2 failure

## Investigation Steps

1. **Run the reconciliation job manually:**
   ```bash
   kubectl create job manual-reconcile --from=cronjob/audit-reconciliation -n monitoring
   kubectl logs job/manual-reconcile -n monitoring
   ```

2. **Check audit service Kafka consumer:**
   ```bash
   kubectl logs deploy/audit-service -n opsera-internal --tail=200 | grep -E "ERROR|WARN"
   ```

3. **Compare event counts:**
   ```sql
   -- Expected events from application topics
   SELECT COUNT(*) FROM audit.records WHERE event_timestamp >= NOW() - INTERVAL '1 hour';
   ```

4. **Check Kafka DLQ for failed audit events:**
   ```bash
   kubectl exec -n opsera-kafka opsera-kafka-kafka-0 -- \
     kafka-console-consumer.sh --topic audit.events.dlq \
     --from-beginning --max-messages 20
   ```

## Remediation

- **DLQ messages:** Fix the consumer bug, then replay DLQ messages using Kafka consumer offset reset
- **Kafka consumer down:** Restart `audit-service`, verify it can connect to Kafka
- **Database issue:** Check audit schema `audit_app_role` permissions; verify pg_partman has created current partition

## Escalation

**IMMEDIATE:** Page Compliance Officer and CISO on-call if discrepancy persists > 1 hour.
This is a SOX compliance incident. Create an incident record in PagerDuty.
