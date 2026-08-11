output "cluster_role_arn" {
  description = "IAM role ARN for EKS cluster (AWS only)"
  value       = var.cloud_provider == "aws" && length(aws_iam_role.cluster_admin) > 0 ? aws_iam_role.cluster_admin[0].arn : ""
}

output "node_role_arn" {
  description = "IAM role ARN for EKS node groups (AWS only)"
  value       = var.cloud_provider == "aws" && length(aws_iam_role.node_group) > 0 ? aws_iam_role.node_group[0].arn : ""
}

output "workload_identity_role_arn" {
  description = "IAM role ARN for IRSA (AWS) / Workload Identity (GCP)"
  value = (
    var.cloud_provider == "aws" && length(aws_iam_role.workload_identity) > 0 ? aws_iam_role.workload_identity[0].arn :
    var.cloud_provider == "gcp" && length(google_service_account.workload_identity) > 0 ? google_service_account.workload_identity[0].email :
    var.cloud_provider == "azure" && length(azurerm_user_assigned_identity.cluster_admin) > 0 ? azurerm_user_assigned_identity.cluster_admin[0].principal_id :
    ""
  )
}

output "gcp_cluster_sa_email" {
  description = "GCP service account email for GKE cluster nodes"
  value       = var.cloud_provider == "gcp" && length(google_service_account.cluster_admin) > 0 ? google_service_account.cluster_admin[0].email : ""
}

output "azure_identity_id" {
  description = "Azure managed identity ID for AKS"
  value       = var.cloud_provider == "azure" && length(azurerm_user_assigned_identity.cluster_admin) > 0 ? azurerm_user_assigned_identity.cluster_admin[0].id : ""
}
