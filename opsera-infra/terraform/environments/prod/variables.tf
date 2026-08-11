variable "cloud_provider" {
  description = "Target cloud provider: aws | gcp | azure"
  type        = string
  default     = "aws"
}

variable "region" {
  description = "Cloud region"
  type        = string
  default     = "us-east-1"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.29"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "system_node_count" {
  type    = number
  default = 2
}

variable "workload_node_min" {
  type    = number
  default = 2
}

variable "workload_node_max" {
  type    = number
  default = 6
}

variable "system_instance_type" {
  type    = string
  default = "m5.large"
}

variable "workload_instance_type" {
  type    = string
  default = "m5.xlarge"
}

variable "gcp_project_id" {
  description = "GCP project ID (required for GCP)"
  type        = string
  default     = ""
}

variable "azure_subscription_id" {
  description = "Azure subscription ID (required for Azure)"
  type        = string
  default     = ""
}

variable "azure_resource_group" {
  description = "Azure resource group name"
  type        = string
  default     = ""
}
