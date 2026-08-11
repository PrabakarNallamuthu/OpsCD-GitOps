# Opsera Platform — Disaster Recovery Procedures

## Overview

| Component      | RTO     | RPO     | Backup Strategy                        | Test Frequency  |
|---------------|---------|---------|----------------------------------------|-----------------|
| PostgreSQL    | 4 hours | 1 hour  | Continuous WAL archiving + daily full  | Monthly         |
| Kafka         | 30 min  | 0 loss  | RF=3, min ISR=2, cross-AZ placement   | Quarterly       |
| Redis         | 15 min  | 1 hour  | AOF (fsync/sec) + hourly RDB to MinIO | Monthly         |
| Elasticsearch | 2 hours | 24 hours| Daily snapshot to MinIO               | Quarterly       |
| Vault         | 1 hour  | 0 loss  | Raft RF=3 + daily Raft snapshot       | Quarterly       |
| Full Platform | 2 hours | 1 hour  | IaC + above components                | Semi-annually   |

## Procedure Index

- [PostgreSQL DR](./postgresql-dr.md) — PITR, WAL archiving, restore
- [Kafka DR](./kafka-dr.md) — Broker replacement, consumer offset management
- [Redis DR](./redis-dr.md) — Sentinel failover, RDB restore
- [Elasticsearch DR](./elasticsearch-dr.md) — Snapshot restore, Kafka replay
- [Vault DR](./vault-dr.md) — Raft snapshot, unseal, key rotation
- [Full Platform Recovery](./full-platform-recovery.md) — Complete re-provisioning sequence
- [DR Test Schedule](./test-schedule.md) — Recurring test calendar and results

## Critical Architecture Note

**PostgreSQL single-region DR gap:** The current PostgreSQL deployment is single-region.
For full compliance with SOC 2 Availability CC9.1, a cross-region read replica or
automated failover to a standby cluster must be added in a future work order (WO-096-ext).
Until then, the RTO for a regional outage affecting PostgreSQL is estimated at 6-8 hours
(vs the documented 4-hour target).

## Emergency Contacts

See PagerDuty escalation policy: `opsera-platform-sre`
