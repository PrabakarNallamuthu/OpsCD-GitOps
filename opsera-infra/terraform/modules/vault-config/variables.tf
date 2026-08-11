variable "kubernetes_host" {
  type        = string
  description = "Kubernetes API server URL"
}

variable "kubernetes_ca_cert" {
  type        = string
  description = "Kubernetes cluster CA certificate (PEM)"
  sensitive   = true
}

variable "postgresql_host" {
  type        = string
  description = "PostgreSQL host for Vault database secrets engine"
}

variable "postgresql_port" {
  type    = number
  default = 5432
}

variable "postgresql_database" {
  type    = string
  default = "opsera"
}

variable "postgresql_root_username" {
  type      = string
  sensitive = true
}

variable "postgresql_root_password" {
  type      = string
  sensitive = true
}

variable "namespace" {
  type        = string
  description = "Kubernetes namespace where services run"
  default     = "opsera-internal"
}

variable "services" {
  type        = list(string)
  description = "List of service schema names for per-service Vault roles"
  default = [
    "release_service",
    "risk_engine",
    "policy_engine",
    "audit_service",
    "verification_service",
    "analytics_service",
    "auth_service",
    "bff_service",
  ]
}
