# Architecture Decision Records

Architecture Decision Records (ADRs) document significant technology and design decisions
for the Opsera platform, using Michael Nygard's template format.

## ADR Index

| #       | Title                                          | Status   | Date       | Category     |
|---------|------------------------------------------------|----------|------------|--------------|
| ADR-001 | Backend Language — TypeScript/NestJS           | Accepted | 2026-08-11 | Technology   |
| ADR-002 | Frontend Framework — React 18                  | Accepted | 2026-08-11 | Technology   |
| ADR-003 | Primary Database — PostgreSQL 16               | Accepted | 2026-08-11 | Technology   |
| ADR-004 | Event Streaming — Kafka via Strimzi            | Accepted | 2026-08-11 | Technology   |
| ADR-005 | API Style — REST + OpenAPI 3.1 + WebSocket     | Accepted | 2026-08-11 | Technology   |
| ADR-006 | API Gateway — Kong 3.x                         | Accepted | 2026-08-11 | Technology   |
| ADR-007 | Service Mesh — Linkerd                         | Accepted | 2026-08-11 | Technology   |
| ADR-008 | ORM — Prisma 5.x                               | Accepted | 2026-08-11 | Technology   |
| ADR-009 | Cache and Sessions — Redis 7 + Sentinel        | Accepted | 2026-08-11 | Technology   |
| ADR-010 | Container Base Image — Distroless              | Accepted | 2026-08-11 | Security     |
| ADR-011 | Infrastructure as Code — Terraform + Helm      | Accepted | 2026-08-11 | Operations   |
| ADR-012 | CI/CD — Opsera Forge Shipping Engine           | Accepted | 2026-08-11 | Technology   |
| ADR-013 | Secret Management — HashiCorp Vault + ESO      | Accepted | 2026-08-11 | Security     |
| ADR-014 | Observability — Prometheus + Grafana + Jaeger  | Accepted | 2026-08-11 | Operations   |
| ADR-015 | Schema Registry — Confluent                    | Accepted | 2026-08-11 | Technology   |
| ADR-016 | Search — Elasticsearch 8 via ECK              | Accepted | 2026-08-11 | Technology   |
| ADR-017 | Object Storage — MinIO                         | Accepted | 2026-08-11 | Technology   |
| ADR-018 | Circuit Breaker — opossum 8.x                 | Accepted | 2026-08-11 | Architecture |
| ADR-019 | Immutability-First Data Model                  | Accepted | 2026-08-11 | Architecture |
| ADR-020 | Event-Driven Decoupling via Kafka              | Accepted | 2026-08-11 | Architecture |
| ADR-021 | Hexagonal Architecture per Microservice        | Accepted | 2026-08-11 | Architecture |
| ADR-022 | Defense-in-Depth — 4 Trust Zones               | Accepted | 2026-08-11 | Security     |
| ADR-023 | SSO-Only Authentication (No Local Passwords)  | Accepted | 2026-08-11 | Security     |
| ADR-024 | Cloud-Agnostic Kubernetes-Native Deployments  | Accepted | 2026-08-11 | Architecture |
| ADR-025 | Schema Evolution — Backward Compatibility Only | Accepted | 2026-08-11 | Architecture |

## How to Propose a New ADR

1. Copy `TEMPLATE.md` to `ADR-NNN.md` with the next sequence number.
2. Fill in all sections including Compliance Impact.
3. Set status to **Proposed** and submit a pull request.
4. After review and approval, update status to **Accepted**.
5. Add the ADR to the index table in this README.
