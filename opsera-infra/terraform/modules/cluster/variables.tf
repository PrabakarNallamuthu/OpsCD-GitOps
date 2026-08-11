variable "cloud_provider" {
  description = "Target cloud provider: aws | gcp | azure"
  type        = string
  validation {
    condition     = contains(["aws", "gcp", "azure"], var.cloud_provider)
    error_message = "cloud_provider must be one of: aws, gcp, azure."
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "opsera"
}

variable "region" {
  description = "Cloud region"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version (1.29+)"
  type        = string
  default     = "1.29"

  validation {
    condition     = tonumber(split(".", var.kubernetes_version)[1]) >= 29
    error_message = "Kubernetes version must be 1.29 or higher."
  }
}

# ── Node group sizing ──────────────────────────────────────────────────────────
variable "system_node_count" {
  description = "Number of system/infra nodes (fixed)"
  type        = number
  default     = 3
}

variable "workload_node_min" {
  description = "Minimum workload nodes for autoscaling"
  type        = number
  default     = 3
}

variable "workload_node_max" {
  description = "Maximum workload nodes for autoscaling"
  type        = number
  default     = 10
}

variable "system_instance_type" {
  description = "Instance type for system node pool"
  type        = string
  default     = "m5.xlarge"
}

variable "workload_instance_type" {
  description = "Instance type for workload node pool"
  type        = string
  default     = "m5.2xlarge"
}

# ── Networking inputs (from networking module) ─────────────────────────────────
variable "vpc_id" {
  description = "VPC/VNet ID from networking module"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for node groups"
  type        = list(string)
}

variable "cluster_security_group_id" {
  description = "Cluster security group ID (AWS only)"
  type        = string
  default     = ""
}

variable "node_security_group_id" {
  description = "Node security group ID (AWS only)"
  type        = string
  default     = ""
}

# ── IAM inputs (from iam module) ──────────────────────────────────────────────
variable "cluster_role_arn" {
  description = "IAM role ARN for cluster (AWS only)"
  type        = string
  default     = ""
}

variable "node_role_arn" {
  description = "IAM role ARN for node groups (AWS only)"
  type        = string
  default     = ""
}

variable "gcp_cluster_sa_email" {
  description = "GCP service account email for GKE nodes"
  type        = string
  default     = ""
}

variable "azure_identity_id" {
  description = "Azure managed identity ID for AKS"
  type        = string
  default     = ""
}

# ── GCP-specific ──────────────────────────────────────────────────────────────
variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
  default     = ""
}

variable "gcp_subnetwork_name" {
  description = "GCP subnetwork name"
  type        = string
  default     = ""
}

variable "gcp_pods_range_name" {
  description = "GCP secondary range name for pods"
  type        = string
  default     = "pods"
}

variable "gcp_services_range_name" {
  description = "GCP secondary range name for services"
  type        = string
  default     = "services"
}

# ── Azure-specific ────────────────────────────────────────────────────────────
variable "azure_resource_group" {
  description = "Azure resource group name"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags/labels"
  type        = map(string)
  default     = {}
}
