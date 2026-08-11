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

variable "cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
}

variable "oidc_provider_url" {
  description = "OIDC provider URL for IRSA/Workload Identity (without https://)"
  type        = string
  default     = ""
}

variable "oidc_provider_arn" {
  description = "OIDC provider ARN (AWS IRSA only)"
  type        = string
  default     = ""
}

# GCP-specific
variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
  default     = ""
}

# Azure-specific
variable "azure_subscription_id" {
  description = "Azure subscription ID"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
