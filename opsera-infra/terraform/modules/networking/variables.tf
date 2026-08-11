variable "cloud_provider" {
  description = "Target cloud provider: aws | gcp | azure"
  type        = string
  validation {
    condition     = contains(["aws", "gcp", "azure"], var.cloud_provider)
    error_message = "cloud_provider must be one of: aws, gcp, azure."
  }
}

variable "environment" {
  description = "Deployment environment: dev | staging | prod"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project name prefix for all resource names"
  type        = string
  default     = "opsera"
}

variable "region" {
  description = "Cloud region / location"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC/VNet"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones (min 2 required)"
  type        = list(string)
  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least 2 availability zones must be specified."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# GCP-specific
variable "gcp_project_id" {
  description = "GCP project ID (required when cloud_provider = gcp)"
  type        = string
  default     = ""
}

# Azure-specific
variable "azure_resource_group" {
  description = "Azure Resource Group name (required when cloud_provider = azure)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags/labels to apply to all resources"
  type        = map(string)
  default     = {}
}
