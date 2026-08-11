# DR Test Schedule and Results

## Recurring Test Calendar

| Test                             | Frequency      | Schedule         | Owner          |
|----------------------------------|----------------|------------------|----------------|
| PostgreSQL PITR Restoration      | Monthly        | 1st Monday 10:00 | SRE On-call    |
| Redis Sentinel Failover          | Monthly        | 2nd Monday 10:00 | SRE On-call    |
| Kafka Broker Failure Simulation  | Quarterly      | Q1/Q2/Q3/Q4 Mon  | Platform Team  |
| Vault Seal/Unseal Test           | Quarterly      | Q1/Q2/Q3/Q4 Mon  | Security Team  |
| Full Platform Re-provisioning    | Semi-annually  | Jan, Jul         | All SRE        |

## Test Results Log

| Date       | Test                | Duration | Outcome | Notes                        |
|------------|---------------------|----------|---------|------------------------------|
| 2026-08-11 | PostgreSQL PITR     | -        | Pending | Initial local implementation |
