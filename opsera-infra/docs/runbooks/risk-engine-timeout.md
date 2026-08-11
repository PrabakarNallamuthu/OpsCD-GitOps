# Runbook: Risk Engine Analysis Timeout

**Alert:** `RiskAnalysisTimeout`
**Severity:** CRITICAL
**Blast Radius:** Risk analysis blocked — Release Managers cannot get Go/No-Go decisions

## Trigger Condition

```promql
histogram_quantile(0.95, sum(rate(risk_analysis_duration_seconds_bucket[10m])) by (le)) > 90
```

## Diagnosis Steps

1. **Check Risk Engine consumer lag:**
   ```bash
   kubectl exec -n opsera-kafka opsera-kafka-kafka-0 -- \
     kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
     --describe --group risk-engine-consumer
   ```

2. **Check Risk Engine pod health:**
   ```bash
   kubectl get pods -n opsera-internal -l app=risk-engine
   kubectl logs -n opsera-internal deploy/risk-engine --tail=200 | grep -E "timeout|ERROR"
   ```

3. **Check circuit breaker state:**
   ```bash
   curl -s http://risk-engine.opsera-internal.svc.cluster.local:3000/metrics \
     | grep circuit_breaker
   ```

4. **Check Policy Engine latency (risk-engine calls policy-engine):**
   ```bash
   kubectl logs -n opsera-internal deploy/policy-engine --tail=100 | grep p95
   ```

5. **Check PostgreSQL slow queries:**
   ```sql
   SELECT pid, now() - query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND now() - query_start > interval '5 seconds'
   ORDER BY duration DESC;
   ```

## Resolution Steps

1. **Scale Risk Engine HPA:**
   ```bash
   kubectl patch hpa risk-engine-hpa -n opsera-internal \
     -p '{"spec":{"minReplicas": 5}}'
   ```

2. **Reset circuit breaker (if Policy Engine is flapping):**
   ```bash
   kubectl rollout restart deploy/risk-engine -n opsera-internal
   ```

3. **Check for recent policy rule changes causing slow CEL evaluation:**
   ```bash
   kubectl exec -n opsera-internal deploy/policy-engine -- \
     curl -s localhost:3000/api/v1/policies?sort_by=updated_at | jq '.data[0:5]'
   ```

4. **Increase analysis timeout (temporary — must revert after incident):**
   ```bash
   kubectl set env deploy/risk-engine ANALYSIS_TIMEOUT_MS=180000 -n opsera-internal
   ```

## Escalation

- **> 10 min:** Page Platform Team
- **> 30 min:** Manual risk assessment required — Release Managers must use manual override process documented at [Manual Override Procedure](./risk-manual-override.md)

## Post-Incident Checklist

- [ ] Root cause identified (Policy Engine? PostgreSQL? CEL complexity?)
- [ ] HPA min replicas restored to normal
- [ ] Analysis timeout reverted if changed
- [ ] Risk threshold review: should timeout be increased permanently?
- [ ] Incident documented in runbook with new findings
