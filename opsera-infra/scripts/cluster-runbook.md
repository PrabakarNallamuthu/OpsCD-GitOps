# Opsera Cluster Provisioning Runbook

## Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Terraform | 1.8.0 | `brew install terraform` |
| AWS CLI | 2.x | `brew install awscli` |
| kubectl | 1.29+ | `brew install kubectl` |
| Helm | 3.x | `brew install helm` |
| cosign | 2.x | `brew install cosign` |

For GCP: install `gke-gcloud-auth-plugin`
For Azure: install `azure-cli` and `kubelogin`

---

## Provision a cluster (first time)

### AWS EKS (primary target)

```bash
cd terraform/environments/dev

# 1. Initialise Terraform with S3 backend
terraform init \
  -backend-config="bucket=opsera-tfstate-dev" \
  -backend-config="key=opsera/dev/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=opsera-tfstate-lock-dev"

# 2. Review plan (CI will capture this as an artifact)
terraform plan -out=tfplan -var-file=terraform.tfvars

# 3. Apply
terraform apply tfplan

# 4. Configure kubectl
$(terraform output -raw kubeconfig_command)

# 5. Verify nodes are Ready
kubectl get nodes

# 6. Run smoke test
kubectl apply -f ../../scripts/smoke-test-job.yaml
kubectl wait --for=condition=complete job/opsera-smoke-test -n opsera-internal --timeout=120s
kubectl logs job/opsera-smoke-test -n opsera-internal
```

### GCP GKE

```bash
terraform plan -out=tfplan -var-file=terraform-gcp.tfvars
terraform apply tfplan
$(terraform output -raw kubeconfig_command)
```

### Azure AKS

```bash
terraform plan -out=tfplan -var-file=terraform-azure.tfvars
terraform apply tfplan
$(terraform output -raw kubeconfig_command)
```

---

## Teardown

```bash
cd terraform/environments/<env>
terraform destroy -var-file=terraform.tfvars
```

**WARNING:** This permanently destroys all cluster resources. Ensure workloads are
migrated before running destroy in staging or prod.

---

## Disaster Recovery — Full Re-provision (target: < 2 hours)

### Step-by-step

| Step | Action | Estimated Time |
|------|--------|---------------|
| 1 | Checkout latest main branch | 2 min |
| 2 | `terraform init` (backend already configured) | 3 min |
| 3 | `terraform apply` | 20–35 min |
| 4 | `aws eks update-kubeconfig` | 1 min |
| 5 | Verify nodes with `kubectl get nodes` | 2 min |
| 6 | Deploy core infrastructure (Linkerd, Kong, Vault) | 20–30 min |
| 7 | Deploy application services | 15–20 min |
| 8 | Run smoke test Job | 5 min |
| **Total** | | **~80 min (target < 120 min)** |

### Recovery checklist

- [ ] VPC / networking provisioned
- [ ] IAM roles created (cluster, node, IRSA)
- [ ] EKS cluster control plane Ready
- [ ] System and workload node groups Joined
- [ ] All 4 namespaces created with correct labels
- [ ] kubectl access verified (`kubectl get nodes`)
- [ ] Smoke test Job Completed
- [ ] Cosign keys rotated if compromise suspected

---

## State management

### Recovering from state corruption

```bash
# Import an existing cluster into state
terraform import module.cluster.aws_eks_cluster.main[0] opsera-dev

# Taint a resource for forced re-creation
terraform taint module.cluster.aws_eks_node_group.workload[0]
terraform apply
```

### State lock contention (concurrent plan)

If state is locked by a failed or stale plan:

```bash
# Identify the lock holder from DynamoDB
aws dynamodb get-item \
  --table-name opsera-tfstate-lock-dev \
  --key '{"LockID": {"S": "opsera-tfstate-dev/opsera/dev/terraform.tfstate"}}'

# Force-unlock (only after confirming no active apply)
terraform force-unlock <LOCK_ID>
```

---

## Checkov IaC Security Scan

```bash
# Install
pip install checkov

# Scan all Terraform modules
checkov -d terraform/ \
  --framework terraform \
  --check CKV_AWS_*,CKV_K8S_* \
  --soft-fail-on MEDIUM \
  --hard-fail-on HIGH,CRITICAL

# Output as JUnit XML for CI
checkov -d terraform/ --output junitxml > checkov-results.xml
```

---

## Autoscaling edge cases

Node group autoscaler cannot provision nodes due to capacity constraints:

- Configure multiple instance types (Spot fleet): add `capacity_type = "SPOT"` and
  `instance_types = ["m5.xlarge", "m5a.xlarge", "m4.xlarge"]`
- Configure Cluster Autoscaler with `--balance-similar-node-groups=true`
- Use multi-AZ node groups to allow cross-AZ fallback
