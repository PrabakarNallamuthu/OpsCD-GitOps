terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

locals {
  cluster_name = "${var.project_name}-${var.environment}"
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      WO          = "WO-001"
    },
    var.tags
  )
}

# ─────────────────────────────────────────────────────────────────────────────
# AWS EKS
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_eks_cluster" "main" {
  count    = var.cloud_provider == "aws" ? 1 : 0
  name     = local.cluster_name
  role_arn = var.cluster_role_arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    security_group_ids      = var.cluster_security_group_id != "" ? [var.cluster_security_group_id] : []
    endpoint_private_access = true
    endpoint_public_access  = true

    # Restrict public API access to known CIDRs in prod — configured via
    # public_access_cidrs in environment tfvars
  }

  # Enable secrets encryption at rest
  encryption_config {
    resources = ["secrets"]
    provider {
      key_arn = aws_kms_key.eks[0].arn
    }
  }

  # Enable cluster logging for audit trail
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = local.common_tags

  depends_on = [aws_kms_key.eks]
}

resource "aws_kms_key" "eks" {
  count                   = var.cloud_provider == "aws" ? 1 : 0
  description             = "EKS secrets encryption — ${local.cluster_name}"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "eks" {
  count         = var.cloud_provider == "aws" ? 1 : 0
  name          = "alias/${local.cluster_name}-eks"
  target_key_id = aws_kms_key.eks[0].key_id
}

# EKS Managed Node Group — system pool (infra workloads)
resource "aws_eks_node_group" "system" {
  count           = var.cloud_provider == "aws" ? 1 : 0
  cluster_name    = aws_eks_cluster.main[0].name
  node_group_name = "${local.cluster_name}-system"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = [var.system_instance_type]

  scaling_config {
    desired_size = var.system_node_count
    min_size     = var.system_node_count
    max_size     = var.system_node_count
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    "opsera.io/node-pool" = "system"
    "opsera.io/env"       = var.environment
  }

  taint {
    key    = "CriticalAddonsOnly"
    value  = "true"
    effect = "NO_SCHEDULE"
  }

  tags = local.common_tags
}

# EKS Managed Node Group — workload pool (autoscaling)
resource "aws_eks_node_group" "workload" {
  count           = var.cloud_provider == "aws" ? 1 : 0
  cluster_name    = aws_eks_cluster.main[0].name
  node_group_name = "${local.cluster_name}-workload"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = [var.workload_instance_type]

  scaling_config {
    desired_size = var.workload_node_min
    min_size     = var.workload_node_min
    max_size     = var.workload_node_max
  }

  update_config {
    max_unavailable = 2
  }

  labels = {
    "opsera.io/node-pool" = "workload"
    "opsera.io/env"       = var.environment
  }

  tags = local.common_tags

  depends_on = [aws_eks_node_group.system]
}

# OIDC provider for IRSA (IAM Roles for Service Accounts)
data "tls_certificate" "eks_oidc" {
  count = var.cloud_provider == "aws" ? 1 : 0
  url   = aws_eks_cluster.main[0].identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  count           = var.cloud_provider == "aws" ? 1 : 0
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks_oidc[0].certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main[0].identity[0].oidc[0].issuer
  tags            = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# GCP GKE
# ─────────────────────────────────────────────────────────────────────────────
resource "google_container_cluster" "main" {
  count    = var.cloud_provider == "gcp" ? 1 : 0
  project  = var.gcp_project_id
  name     = local.cluster_name
  location = var.region

  # Use Autopilot or regional cluster for HA
  network    = var.vpc_id
  subnetwork = var.gcp_subnetwork_name

  min_master_version = var.kubernetes_version

  ip_allocation_policy {
    cluster_secondary_range_name  = var.gcp_pods_range_name
    services_secondary_range_name = var.gcp_services_range_name
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.gcp_project_id}.svc.id.goog"
  }

  # Private cluster — nodes not publicly accessible
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Remove default node pool — we manage node pools separately
  remove_default_node_pool = true
  initial_node_count       = 1

  # Enable network policy
  network_policy {
    enabled  = true
    provider = "CALICO"
  }

  # Binary authorization for container image verification
  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  release_channel {
    channel = "REGULAR"
  }
}

resource "google_container_node_pool" "system" {
  count      = var.cloud_provider == "gcp" ? 1 : 0
  project    = var.gcp_project_id
  name       = "${local.cluster_name}-system"
  location   = var.region
  cluster    = google_container_cluster.main[0].name
  node_count = var.system_node_count

  node_config {
    machine_type    = "n2-standard-4"
    service_account = var.gcp_cluster_sa_email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]

    labels = {
      "opsera.io/node-pool" = "system"
      "opsera.io/env"       = var.environment
    }

    taint {
      key    = "CriticalAddonsOnly"
      value  = "true"
      effect = "NO_SCHEDULE"
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}

resource "google_container_node_pool" "workload" {
  count    = var.cloud_provider == "gcp" ? 1 : 0
  project  = var.gcp_project_id
  name     = "${local.cluster_name}-workload"
  location = var.region
  cluster  = google_container_cluster.main[0].name

  autoscaling {
    min_node_count = var.workload_node_min
    max_node_count = var.workload_node_max
  }

  node_config {
    machine_type    = "n2-standard-8"
    service_account = var.gcp_cluster_sa_email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]

    labels = {
      "opsera.io/node-pool" = "workload"
      "opsera.io/env"       = var.environment
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# Azure AKS
# ─────────────────────────────────────────────────────────────────────────────
resource "azurerm_kubernetes_cluster" "main" {
  count               = var.cloud_provider == "azure" ? 1 : 0
  name                = local.cluster_name
  location            = var.region
  resource_group_name = var.azure_resource_group
  dns_prefix          = local.cluster_name
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                = "system"
    node_count          = var.system_node_count
    vm_size             = "Standard_D4s_v3"
    vnet_subnet_id      = length(var.private_subnet_ids) > 0 ? var.private_subnet_ids[0] : null
    type                = "VirtualMachineScaleSets"
    only_critical_addons_enabled = true

    node_labels = {
      "opsera.io/node-pool" = "system"
      "opsera.io/env"       = var.environment
    }
  }

  identity {
    type         = "UserAssigned"
    identity_ids = var.azure_identity_id != "" ? [var.azure_identity_id] : []
  }

  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    load_balancer_sku = "standard"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main[0].id
  }

  azure_policy_enabled             = true
  local_account_disabled           = true
  role_based_access_control_enabled = true

  tags = local.common_tags
}

resource "azurerm_log_analytics_workspace" "main" {
  count               = var.cloud_provider == "azure" ? 1 : 0
  name                = "${local.cluster_name}-logs"
  location            = var.region
  resource_group_name = var.azure_resource_group
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

resource "azurerm_kubernetes_cluster_node_pool" "workload" {
  count                 = var.cloud_provider == "azure" ? 1 : 0
  name                  = "workload"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main[0].id
  vm_size               = "Standard_D8s_v3"
  enable_auto_scaling   = true
  min_count             = var.workload_node_min
  max_count             = var.workload_node_max
  vnet_subnet_id        = length(var.private_subnet_ids) > 0 ? var.private_subnet_ids[0] : null

  node_labels = {
    "opsera.io/node-pool" = "workload"
    "opsera.io/env"       = var.environment
  }

  tags = local.common_tags
}
