# Vault configuration: Kubernetes auth, PostgreSQL dynamic secrets, per-service policies

terraform {
  required_providers {
    vault = { source = "hashicorp/vault", version = "~> 4.0" }
  }
}

# ─── Kubernetes Auth Method ───────────────────────────────────────────────────
resource "vault_auth_backend" "kubernetes" {
  type = "kubernetes"
  path = "kubernetes"
}

resource "vault_kubernetes_auth_backend_config" "config" {
  backend            = vault_auth_backend.kubernetes.path
  kubernetes_host    = var.kubernetes_host
  kubernetes_ca_cert = var.kubernetes_ca_cert
}

# ─── PostgreSQL Dynamic Secrets Engine ───────────────────────────────────────
resource "vault_mount" "database" {
  path = "database"
  type = "database"
}

resource "vault_database_secret_backend_connection" "postgresql" {
  backend       = vault_mount.database.path
  name          = "opsera-postgresql"
  allowed_roles = [for svc in var.services : "${svc}-role"]

  postgresql {
    connection_url = "postgresql://{{username}}:{{password}}@${var.postgresql_host}:${var.postgresql_port}/${var.postgresql_database}"
    username       = var.postgresql_root_username
    password       = var.postgresql_root_password
    max_open_connections = 5
  }
}

# Per-service dynamic credential roles (24h TTL, 48h max TTL)
resource "vault_database_secret_backend_role" "service_roles" {
  for_each = toset(var.services)

  backend             = vault_mount.database.path
  name                = "${each.value}-role"
  db_name             = vault_database_secret_backend_connection.postgresql.name
  creation_statements = [
    "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';",
    "GRANT ${each.value} TO \"{{name}}\";",
  ]
  revocation_statements = [
    "REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${each.value} FROM \"{{name}}\";",
    "DROP ROLE IF EXISTS \"{{name}}\";",
  ]
  default_ttl = "24h"
  max_ttl     = "48h"
}

# ─── Vault Policies ───────────────────────────────────────────────────────────
resource "vault_policy" "service_policies" {
  for_each = toset(var.services)
  name     = "${each.value}-policy"

  policy = <<-EOT
    path "database/creds/${each.value}-role" {
      capabilities = ["read"]
    }
    path "secret/data/services/${each.value}/*" {
      capabilities = ["read"]
    }
    path "transit/decrypt/${each.value}" {
      capabilities = ["update"]
    }
    path "transit/encrypt/${each.value}" {
      capabilities = ["update"]
    }
  EOT
}

# Kubernetes auth role per service
resource "vault_kubernetes_auth_backend_role" "service_roles" {
  for_each = toset(var.services)

  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = each.value
  bound_service_account_names      = [each.value]
  bound_service_account_namespaces = [var.namespace]
  token_policies                   = ["${each.value}-policy"]
  token_ttl                        = 3600
  token_max_ttl                    = 86400
}

# ─── Transit Engine for PII Encryption ───────────────────────────────────────
resource "vault_mount" "transit" {
  path = "transit"
  type = "transit"
}

resource "vault_transit_secret_backend_key" "service_keys" {
  for_each = toset(var.services)
  backend  = vault_mount.transit.path
  name     = each.value
  type     = "aes256-gcm96"
}

# ─── Audit Logging ───────────────────────────────────────────────────────────
resource "vault_audit" "file" {
  type = "file"
  options = {
    file_path = "stdout"
    format    = "json"
  }
}
