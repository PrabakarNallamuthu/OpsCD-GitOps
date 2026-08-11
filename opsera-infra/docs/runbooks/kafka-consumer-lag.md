# Runbook: Kafka Consumer Lag Alert

**Severity**: High  
**Service**: Any Kafka consumer (audit-service, analytics-service, verification-service)  
**Alert**: `kafka_consumer_lag > 10000`

## Diagnosis

```bash
# Check consumer group lag
kubectl exec -n opsera deploy/kafka-broker -- \
  kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group audit-consumer-group

# Check pod logs for errors
kubectl logs -n opsera -l app=audit-service --tail=200 | grep -i "kafka\|error\|dlq"

# Check DLQ topic for poison pills
kubectl exec -n opsera deploy/kafka-broker -- \
  kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic audit.records.dlq --from-beginning --max-messages 10
```

## Remediation

### 1. Consumer is down — restart
```bash
kubectl rollout restart deployment/audit-service -n opsera
kubectl rollout status deployment/audit-service -n opsera
```

### 2. Lag accumulating — scale out
```bash
kubectl scale deployment/audit-service -n opsera --replicas=5
```

### 3. Poison pill causing repeated failures — skip
```bash
# Only after confirming DLQ processing
kubectl exec -n opsera deploy/kafka-broker -- \
  kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group audit-consumer-group --reset-offsets \
  --topic audit.records --shift-by 1 --execute
```

## Post-Incident
- Confirm lag returns to < 100 within 15 minutes.
- Review DLQ messages and file bug if payload malformed.
- Update Schema Registry if schema mismatch caused failures.
