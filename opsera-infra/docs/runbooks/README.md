# Opsera Platform Operational Runbooks

**WO-095** — Operational runbooks for critical incident scenarios.

All runbooks follow the [standard template](./TEMPLATE.md).

## Index

| Runbook | Alert Name | Severity | Blast Radius |
|---------|-----------|----------|--------------|
| [Auth Service Outage](./auth-service-outage.md) | `CriticalAPIErrorRate` | Critical | All services |
| [Kafka Consumer Lag](./kafka-consumer-lag.md) | `KafkaConsumerLagHigh` | Critical | Event-driven services |
| [PostgreSQL Connection Exhaustion](./postgresql-connection-exhaustion.md) | `PostgreSQLConnectionCritical` | Critical | All DB services |
| [Risk Engine Timeout](./risk-engine-timeout.md) | `RiskAnalysisTimeout` | Critical | Release workflow |
| [Audit Trail Gap](./audit-trail-gap.md) | `AuditTrailGap` | Critical | SOX compliance |
| [High API Error Rate](./high-api-error-rate.md) | `HighAPIErrorRate` | Warning/Critical | Affected service |
| [Service Availability](./service-availability.md) | `ServicePodsBelowPDB` | Critical | Specific service |

## Quick Reference

In an incident, use `kubectl get pods -n opsera-internal` first. Then follow the runbook for the firing alert.

All runbooks include:
- Trigger condition (Prometheus expression)
- Step-by-step diagnosis (with specific commands)
- Resolution steps (with expected outcomes)
- Escalation path (who to contact and when)
- Post-incident checklist

## Runbook Standards

See [TEMPLATE.md](./TEMPLATE.md) for authoring new runbooks.
Each runbook must be linked from the corresponding PrometheusRule `runbook_url` annotation.
