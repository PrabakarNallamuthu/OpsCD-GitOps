# ── Vault Policies (HCL) ─────────────────────────────────────────────────────
# One policy per service following least-privilege principle.
# Apply after Vault initialization: vault policy write <name> <file>

# ── auth-service ──────────────────────────────────────────────────────────────
# auth-service.hcl
path "opsera/data/jwt-signing-keys/*" {
  capabilities = ["read"]
}

path "opsera/data/git-provider-tokens/*" {
  capabilities = ["read", "list"]
}

# Dynamic database credentials (read-only for auth service DB)
path "database/creds/auth-service-role" {
  capabilities = ["read"]
}

# Renew own token
path "auth/token/renew-self" {
  capabilities = ["update"]
}

---
# release-service.hcl
path "opsera/data/git-provider-tokens/*" {
  capabilities = ["read", "list"]
}

path "opsera/data/kafka-sasl/*" {
  capabilities = ["read"]
}

path "database/creds/release-service-role" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

---
# risk-engine.hcl
path "database/creds/risk-engine-role" {
  capabilities = ["read"]
}

path "opsera/data/kafka-sasl/*" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

---
# policy-engine.hcl
path "database/creds/policy-engine-role" {
  capabilities = ["read"]
}

path "opsera/data/kafka-sasl/*" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

---
# audit-service.hcl
path "database/creds/audit-service-role" {
  capabilities = ["read"]
}

path "opsera/data/kafka-sasl/*" {
  capabilities = ["read"]
}

path "opsera/data/pii-encryption-keys/*" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

---
# analytics-service.hcl
path "database/creds/analytics-service-role" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

---
# external-secrets-operator.hcl
# ESO needs broad read access to sync secrets to Kubernetes
path "opsera/data/*" {
  capabilities = ["read", "list"]
}

path "opsera/metadata/*" {
  capabilities = ["read", "list"]
}

path "database/creds/*" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}
