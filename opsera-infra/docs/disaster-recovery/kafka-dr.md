# Kafka Disaster Recovery

**RTO:** 30 minutes | **RPO:** 0 data loss (RF=3, min ISR=2)

## Architecture

- 3 Kafka brokers across 3 AZs (Strimzi KafkaNodePool with topology constraints)
- Replication factor: 3 for all topics; min ISR: 2 for audit topics
- No backup needed: Kafka data is replicated across brokers; consumer group offsets are stored in Kafka

## Broker Replacement

If one broker fails, Strimzi automatically initiates partition reassignment. For permanent failure:

```bash
# 1. Identify failed broker
kubectl get pods -n opsera-kafka -l strimzi.io/cluster=opsera-kafka

# 2. Remove failed node from KafkaNodePool (Strimzi will create replacement)
kubectl edit kafkanodepool kafka-pool -n opsera-kafka
# Decrease replicas by 1, then increase back — triggers rolling replacement

# 3. Monitor partition reassignment
kubectl exec -n opsera-kafka opsera-kafka-kafka-0 -- \
  kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \
  --verify --reassignment-json-file /tmp/reassign.json
```

## Consumer Offset Management

If a consumer group loses its offset (e.g., after topic deletion):

```bash
# List consumer group offsets
kubectl exec -n opsera-kafka opsera-kafka-kafka-0 -- \
  kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group release-service-consumers --describe

# Reset to specific timestamp (e.g., before incident)
kubectl exec -n opsera-kafka opsera-kafka-kafka-0 -- \
  kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group release-service-consumers \
  --topic releases.events \
  --reset-offsets --to-datetime 2026-01-01T10:00:00.000 \
  --execute
```
