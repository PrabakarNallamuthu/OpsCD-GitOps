# Linkerd Operational Runbook

## Deploy Linkerd (first time)

```bash
# 1. Add Linkerd Helm repo
helm repo add linkerd https://helm.linkerd.io/stable
helm repo update

# 2. Create linkerd namespace
kubectl create namespace linkerd

# 3. Bootstrap trust anchor (store private key in Vault FIRST)
#    Generate self-signed root CA:
step certificate create root.linkerd.cluster.local trust-anchor.crt trust-anchor.key \
  --profile root-ca --no-password --insecure --not-after 8766h

# Store key in Vault
vault kv put secret/opsera/linkerd/trust-anchor \
  crt=@trust-anchor.crt key=@trust-anchor.key

# Create bootstrap secret (replaced by External Secrets Operator after WO-005)
kubectl create secret tls trust-anchor-tls \
  --cert=trust-anchor.crt --key=trust-anchor.key \
  -n cert-manager

# SHRED the local key copy immediately
shred -vuz trust-anchor.key trust-anchor.crt

# 4. Install cert-manager (if not present)
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true

# 5. Deploy cert-manager ClusterIssuer and Certificate for Linkerd
kubectl apply -f overlays/linkerd/cert-manager-issuer.yaml

# 6. Wait for identity issuer cert to be issued
kubectl wait --for=condition=Ready certificate/linkerd-identity-issuer \
  -n linkerd --timeout=120s

# 7. Install Linkerd CRDs + control plane
helm install opsera-linkerd charts/linkerd \
  --namespace linkerd \
  --values charts/linkerd/values-dev.yaml \
  --wait --timeout 5m

# 8. Verify control plane health
linkerd check

# 9. Apply namespace injection annotations
kubectl apply -f overlays/linkerd/namespace-injection.yaml

# 10. Install Linkerd Viz
helm install opsera-linkerd-viz charts/linkerd-viz \
  --namespace linkerd-viz --create-namespace \
  --values charts/linkerd-viz/values.yaml \
  --wait --timeout 5m

# 11. Verify mTLS
kubectl apply -f overlays/linkerd/mtls-test.yaml
linkerd viz tap ns/opsera-internal --to svc/httpbin
# Expect: tls=true in all tap output
```

---

## Trust Anchor Rotation (annual procedure)

The trust anchor has a 1-year validity. Rotation requires a multi-step
bundle process to avoid breaking existing connections:

```bash
# 1. Retrieve current trust anchor from Vault
vault kv get -field=crt secret/opsera/linkerd/trust-anchor > old-trust-anchor.crt

# 2. Generate new trust anchor
step certificate create root.linkerd.cluster.local new-trust-anchor.crt new-trust-anchor.key \
  --profile root-ca --no-password --insecure --not-after 8766h

# 3. Bundle both old and new trust anchors
cat old-trust-anchor.crt new-trust-anchor.crt > bundle-trust-anchor.crt

# 4. Update Linkerd with the bundle (all proxies accept both anchors)
helm upgrade opsera-linkerd charts/linkerd \
  --namespace linkerd \
  --set-string linkerd-control-plane.identityTrustAnchorsPEM="$(cat bundle-trust-anchor.crt)"

# 5. Verify all proxies updated: linkerd viz stat pods -n opsera-internal

# 6. Store new key in Vault
vault kv put secret/opsera/linkerd/trust-anchor \
  crt=@new-trust-anchor.crt key=@new-trust-anchor.key

# 7. Update cert-manager secret with new anchor
kubectl create secret tls trust-anchor-tls \
  --cert=new-trust-anchor.crt --key=new-trust-anchor.key \
  -n cert-manager --dry-run=client -o yaml | kubectl apply -f -

# 8. Remove old anchor from bundle (after all proxies reload)
helm upgrade opsera-linkerd charts/linkerd \
  --namespace linkerd \
  --set-string linkerd-control-plane.identityTrustAnchorsPEM="$(cat new-trust-anchor.crt)"

# 9. Shred local copies
shred -vuz old-trust-anchor.crt new-trust-anchor.crt new-trust-anchor.key bundle-trust-anchor.crt
```

---

## Identity Issuer Troubleshooting

```bash
# Check cert-manager issuance
kubectl describe certificate linkerd-identity-issuer -n linkerd
kubectl get certificaterequest -n linkerd

# Check Linkerd identity pod logs
kubectl logs -n linkerd -l linkerd.io/control-plane-component=identity

# Manually trigger cert renewal (if auto-renewal fails)
kubectl annotate certificaterequest -n linkerd --all \
  cert-manager.io/certificate-name=linkerd-identity-issuer \
  cert-manager.io/force-renewal=true
```

---

## Sidecar Debugging

```bash
# Check if sidecar is injected
kubectl get pod <pod-name> -n opsera-internal -o jsonpath='{.spec.containers[*].name}'
# Expected: main-container linkerd-proxy

# Inspect proxy config
linkerd viz tap pod/<pod-name> -n opsera-internal

# Check proxy logs
kubectl logs <pod-name> -c linkerd-proxy -n opsera-internal

# Diagnose injection issues
linkerd check --proxy -n opsera-internal
```

---

## Emergency Mesh Bypass

If Linkerd is causing service outages:

```bash
# Option 1: Disable injection on namespace (hot)
kubectl annotate namespace opsera-internal linkerd.io/inject=disabled --overwrite

# Restart pods to remove sidecars
kubectl rollout restart deployment -n opsera-internal

# Option 2: Disable individual pod (without namespace change)
# Add annotation to pod spec: linkerd.io/inject=disabled
# Then rollout restart the deployment

# Option 3: Scale down Linkerd control plane (last resort — breaks mTLS)
kubectl scale deployment -n linkerd --all --replicas=0
```
