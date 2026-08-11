# Runbook: Audit Evidence Export Failures

**Severity**: Medium  
**Service**: audit-service (evidence-export)  
**Alert**: Export job status = `failed` or job stuck in `pending` > 30 minutes

## Diagnosis

```bash
# Check export job status
kubectl exec -n opsera deploy/audit-service -- \
  curl -s http://localhost:3002/api/v1/audit/export/jobs | jq '.[] | {id, status, createdAt}'

# Check MinIO connectivity
kubectl exec -n opsera deploy/audit-service -- \
  mc alias set opsera http://minio:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY && \
  mc ls opsera/audit-exports/

# Check audit-service logs
kubectl logs -n opsera -l app=audit-service --tail=100 | grep -i "export\|minio\|error"
```

## Remediation

### MinIO unavailable
```bash
kubectl get pods -n opsera -l app=minio
kubectl rollout restart deployment/minio -n opsera
```

### Job stuck in pending
```bash
# Retry via API
kubectl exec -n opsera deploy/audit-service -- \
  curl -s -X POST http://localhost:3002/api/v1/audit/export/{jobId}/retry
```

### Disk pressure on MinIO
```bash
# Check storage usage
kubectl exec -n opsera deploy/minio -- df -h /data
# Scale PVC if needed — requires PV expansion enabled
```

## Post-Incident
- Verify completed jobs appear in audit-export bucket.
- Confirm signed URLs can be generated and accessed by requestor.
- File bug if export job remains failed after retry.
