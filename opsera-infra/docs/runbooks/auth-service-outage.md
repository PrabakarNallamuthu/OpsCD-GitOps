# Runbook: Auth Service Outage

**Alert:** `CriticalAPIErrorRate` on `auth-service`
**Severity:** CRITICAL
**Blast Radius:** ALL platform services — every request requires JWT validation via Kong → Auth Service JWKS

## Trigger Condition

```promql
sum(rate(http_request_errors_total{service="auth-service"}[5m])) 
/ sum(rate(http_requests_total{service="auth-service"}[5m])) > 0.01
```

## Diagnosis Steps

1. **Check Auth Service pod health:**
   ```bash
   kubectl get pods -n opsera-internal -l app=auth-service
   kubectl describe pod -n opsera-internal -l app=auth-service
   kubectl logs -n opsera-internal deploy/auth-service --tail=100 | grep -E "ERROR|WARN"
   ```

2. **Check Redis session store:**
   ```bash
   kubectl exec -n opsera-internal deploy/redis-master -- redis-cli ping
   kubectl exec -n opsera-internal deploy/redis-master -- redis-cli info replication
   ```

3. **Verify SSO provider reachability:**
   ```bash
   curl -s "https://<OIDC_ISSUER>/.well-known/openid-configuration" | python3 -m json.tool
   ```

4. **Check JWKS endpoint (cached by Kong):**
   ```bash
   curl -s http://auth-service.opsera-internal.svc.cluster.local:3000/api/v1/auth/.well-known/jwks.json
   ```

5. **Check Kong JWKS cache:**
   ```bash
   kubectl exec -n opsera-internal deploy/kong -- curl -s \
     http://localhost:8001/plugins?name=jwt | jq '.data[].config.jwks_uri'
   ```

## Resolution Steps

1. **Pod restart (most common fix):**
   ```bash
   kubectl rollout restart deploy/auth-service -n opsera-internal
   kubectl rollout status deploy/auth-service -n opsera-internal
   ```

2. **Redis failover (if Redis unavailable):**
   ```bash
   kubectl exec -n opsera-internal deploy/redis-master -- redis-cli CLUSTER FAILOVER
   # Or promote a replica:
   kubectl scale deploy/redis-slave --replicas=1 -n opsera-internal
   ```

3. **If SSO provider is down (maintenance window):**
   - Active sessions continue to work (JWT still valid for up to 15 min)
   - New logins will fail — communicate to users
   - No degraded-mode bypass: authentication cannot be skipped

4. **Force Kong JWKS cache refresh:**
   ```bash
   kubectl exec -n opsera-internal deploy/kong -- curl -s \
     -X DELETE http://localhost:8001/cache/jwks
   ```

## Escalation Path

- **< 5 min:** SRE on-call restarts pods
- **> 5 min:** Escalate to Auth team lead
- **> 15 min:** Escalate to CISO and Engineering Director (SOX compliance risk)
- **Slack:** `#platform-incidents` with @here

## Post-Incident Checklist

- [ ] Root cause identified and documented
- [ ] Auth-service rollout health verified
- [ ] Redis session store reconnected
- [ ] JWKS endpoint accessible from Kong
- [ ] No session data loss confirmed
- [ ] Incident timeline documented in JIRA
- [ ] SOX incident report filed if > 15 min downtime
