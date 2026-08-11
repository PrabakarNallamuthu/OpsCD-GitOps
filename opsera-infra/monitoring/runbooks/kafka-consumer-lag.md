# Runbook: Kafka Consumer Lag High

## Alert: KafkaConsumerLagHigh

**Threshold:** > 10,000 messages lag for 5 minutes on any consumer group

## Investigation Steps

1. **List all consumer groups and their lag:**
   ```bash
   kubectl exec -n opsera-kafka opsera-kafka-kafka-0 -- \
     kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
     --describe --all-groups | grep -v '0$'
   ```

2. **Check if consumers are running:**
   ```bash
   kubectl get pods -n opsera-internal | grep -E "risk|audit|analytics"
   ```

3. **Check DLQ for processing failures:**
   ```bash
   kubectl exec -n opsera-kafka opsera-kafka-kafka-0 -- \
     kafka-console-consumer.sh --bootstrap-server localhost:9092 \
     --topic releases.events.dlq --from-beginning --max-messages 5
   ```

## Remediation

- **Consumer pod crash:** `kubectl rollout restart deploy/<service> -n opsera-internal`
- **DLQ messages:** Investigate root cause, fix, then replay via consumer offset reset
- **Partition imbalance:** Trigger partition rebalance via consumer group restart

## Escalation

PagerDuty on-call → Platform Team → `#kafka-incidents`
