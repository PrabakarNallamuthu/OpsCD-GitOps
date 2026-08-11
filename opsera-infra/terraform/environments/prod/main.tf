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
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

# ── Provider configuration ─────────────────────────────────────────────────────
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "opsera"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.region
}

provider "azurerm" {
  features {}
  subscription_id = var.azure_subscription_id
}

# ── Networking ─────────────────────────────────────────────────────────────────
module "networking" {
  source = "../../modules/networking"

  cloud_provider       = var.cloud_provider
  environment          = "prod"
  project_name         = "opsera"
  region               = var.region
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  gcp_project_id       = var.gcp_project_id
  azure_resource_group = var.azure_resource_group
}

# ── IAM (phase 1 — before OIDC URL is known) ──────────────────────────────────
module "iam" {
  source = "../../modules/iam"

  cloud_provider        = var.cloud_provider
  environment           = "prod"
  project_name          = "opsera"
  cluster_name          = "opsera-dev"
  gcp_project_id        = var.gcp_project_id
  azure_subscription_id = var.azure_subscription_id

  # OIDC values are populated after cluster creation (phase 2 apply)
  oidc_provider_url = module.cluster.oidc_provider_url
  oidc_provider_arn = module.cluster.oidc_provider_arn

  depends_on = [module.cluster]
}

# ── Cluster ────────────────────────────────────────────────────────────────────
module "cluster" {
  source = "../../modules/cluster"

  cloud_provider         = var.cloud_provider
  environment            = "prod"
  project_name           = "opsera"
  region                 = var.region
  kubernetes_version     = var.kubernetes_version
  system_node_count      = var.system_node_count
  workload_node_min      = var.workload_node_min
  workload_node_max      = var.workload_node_max
  system_instance_type   = var.system_instance_type
  workload_instance_type = var.workload_instance_type

  vpc_id                    = module.networking.vpc_id
  private_subnet_ids        = module.networking.private_subnet_ids
  cluster_security_group_id = module.networking.cluster_security_group_id
  node_security_group_id    = module.networking.node_security_group_id
  cluster_role_arn          = module.iam.cluster_role_arn
  node_role_arn             = module.iam.node_role_arn
  gcp_cluster_sa_email      = module.iam.gcp_cluster_sa_email
  azure_identity_id         = module.iam.azure_identity_id
  gcp_project_id            = var.gcp_project_id
  gcp_subnetwork_name       = module.networking.gcp_subnetwork_name
  gcp_pods_range_name       = module.networking.gcp_pods_range_name
  gcp_services_range_name   = module.networking.gcp_services_range_name
  azure_resource_group      = var.azure_resource_group

  depends_on = [module.networking, module.iam]
}

# ── Kubernetes provider (configured from cluster outputs) ─────────────────────
provider "kubernetes" {
  host                   = module.cluster.cluster_endpoint
  cluster_ca_certificate = base64decode(module.cluster.cluster_ca_certificate)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = var.cloud_provider == "aws" ? "aws" : var.cloud_provider == "gcp" ? "gke-gcloud-auth-plugin" : "kubelogin"
    args = var.cloud_provider == "aws" ? [
      "eks", "get-token", "--cluster-name", "opsera-dev", "--region", var.region
    ] : []
  }
}

# ── Namespaces ─────────────────────────────────────────────────────────────────
module "namespaces" {
  source      = "../../modules/namespaces"
  environment = "prod"

  depends_on = [module.cluster]
}
