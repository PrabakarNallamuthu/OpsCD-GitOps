terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

# ─────────────────────────────────────────────────────────────────────────────
# Opsera trust-zone namespaces
#
# Zone hierarchy (least → most privileged):
#   opsera-public   — internet-facing ingress endpoints
#   opsera-dmz      — API gateway, BFF layer
#   opsera-internal — core microservices (auth, release, risk, policy, etc.)
#   opsera-data     — databases, message broker, object storage
# ─────────────────────────────────────────────────────────────────────────────
locals {
  namespaces = [
    {
      name              = "opsera-public"
      zone              = "public"
      description       = "Internet-facing ingress layer"
      linkerd_inject    = "enabled"
    },
    {
      name              = "opsera-dmz"
      zone              = "dmz"
      description       = "API gateway and BFF services"
      linkerd_inject    = "enabled"
    },
    {
      name              = "opsera-internal"
      zone              = "internal"
      description       = "Core microservices — no direct external access"
      linkerd_inject    = "enabled"
    },
    {
      name              = "opsera-data"
      zone              = "data"
      description       = "Stateful services: databases, Kafka, MinIO (own TLS)"
      linkerd_inject    = "disabled"
    },
  ]
}

resource "kubernetes_namespace" "trust_zones" {
  for_each = { for ns in local.namespaces : ns.name => ns }

  metadata {
    name = each.value.name

    labels = {
      # Trust zone label — used by NetworkPolicy selectors
      "opsera.io/zone"        = each.value.zone
      "opsera.io/env"         = var.environment
      "opsera.io/managed-by"  = "terraform"

      # Pod Security Standards — enforce restricted profile for compliance
      "pod-security.kubernetes.io/enforce"         = "restricted"
      "pod-security.kubernetes.io/enforce-version" = "latest"
      "pod-security.kubernetes.io/warn"            = "restricted"
      "pod-security.kubernetes.io/audit"           = "restricted"
    }

    annotations = {
      "opsera.io/description" = each.value.description
      # Linkerd sidecar injection (WO-002):
      # enabled  = all pods get mTLS automatically
      # disabled = data-zone pods use their own TLS (PostgreSQL, Kafka, Redis)
      "linkerd.io/inject" = each.value.linkerd_inject
    }
  }
}

output "namespace_names" {
  description = "Map of zone → namespace name"
  value       = { for k, ns in kubernetes_namespace.trust_zones : ns.metadata[0].labels["opsera.io/zone"] => ns.metadata[0].name }
}
