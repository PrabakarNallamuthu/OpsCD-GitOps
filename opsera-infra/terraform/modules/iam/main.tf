terraform {
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
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags
  )
}

# ─────────────────────────────────────────────────────────────────────────────
# AWS IAM — EKS cluster admin role + node group role + IRSA
# ─────────────────────────────────────────────────────────────────────────────
data "aws_iam_policy_document" "eks_cluster_assume" {
  count = var.cloud_provider == "aws" ? 1 : 0

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cluster_admin" {
  count              = var.cloud_provider == "aws" ? 1 : 0
  name               = "${local.name_prefix}-eks-cluster-role"
  assume_role_policy = data.aws_iam_policy_document.eks_cluster_assume[0].json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cluster_admin_policy" {
  count      = var.cloud_provider == "aws" ? 1 : 0
  role       = aws_iam_role.cluster_admin[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

data "aws_iam_policy_document" "node_assume" {
  count = var.cloud_provider == "aws" ? 1 : 0

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "node_group" {
  count              = var.cloud_provider == "aws" ? 1 : 0
  name               = "${local.name_prefix}-eks-node-role"
  assume_role_policy = data.aws_iam_policy_document.node_assume[0].json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "node_worker" {
  count      = var.cloud_provider == "aws" ? 1 : 0
  role       = aws_iam_role.node_group[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "node_cni" {
  count      = var.cloud_provider == "aws" ? 1 : 0
  role       = aws_iam_role.node_group[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "node_ecr" {
  count      = var.cloud_provider == "aws" ? 1 : 0
  role       = aws_iam_role.node_group[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# IRSA — IAM Roles for Service Accounts
# Allows Kubernetes service accounts to assume IAM roles without static credentials
data "aws_iam_policy_document" "irsa_assume" {
  count = var.cloud_provider == "aws" && var.oidc_provider_arn != "" ? 1 : 0

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
    }

    condition {
      test     = "StringLike"
      variable = "${var.oidc_provider_url}:sub"
      values   = ["system:serviceaccount:*:*"]
    }

    condition {
      test     = "StringEquals"
      variable = "${var.oidc_provider_url}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "workload_identity" {
  count              = var.cloud_provider == "aws" && var.oidc_provider_arn != "" ? 1 : 0
  name               = "${local.name_prefix}-workload-identity-role"
  assume_role_policy = data.aws_iam_policy_document.irsa_assume[0].json
  tags               = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# GCP IAM — GKE service accounts + Workload Identity binding
# ─────────────────────────────────────────────────────────────────────────────
resource "google_service_account" "cluster_admin" {
  count        = var.cloud_provider == "gcp" ? 1 : 0
  project      = var.gcp_project_id
  account_id   = "${local.name_prefix}-gke-admin"
  display_name = "GKE Cluster Admin — ${var.environment}"
}

resource "google_project_iam_member" "cluster_admin_log_writer" {
  count   = var.cloud_provider == "gcp" ? 1 : 0
  project = var.gcp_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cluster_admin[0].email}"
}

resource "google_project_iam_member" "cluster_admin_metric_writer" {
  count   = var.cloud_provider == "gcp" ? 1 : 0
  project = var.gcp_project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cluster_admin[0].email}"
}

resource "google_service_account" "workload_identity" {
  count        = var.cloud_provider == "gcp" ? 1 : 0
  project      = var.gcp_project_id
  account_id   = "${local.name_prefix}-workload-id"
  display_name = "Workload Identity — ${var.environment}"
}

# Workload Identity binding — Kubernetes SA → GCP SA
resource "google_service_account_iam_member" "workload_identity_binding" {
  count              = var.cloud_provider == "gcp" ? 1 : 0
  service_account_id = google_service_account.workload_identity[0].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.gcp_project_id}.svc.id.goog[opsera-internal/opsera-workload]"
}

# ─────────────────────────────────────────────────────────────────────────────
# Azure IAM — AKS managed identity
# ─────────────────────────────────────────────────────────────────────────────
resource "azurerm_user_assigned_identity" "cluster_admin" {
  count               = var.cloud_provider == "azure" ? 1 : 0
  name                = "${local.name_prefix}-aks-identity"
  resource_group_name = "${local.name_prefix}-rg"
  location            = "eastus"
  tags                = local.common_tags
}
