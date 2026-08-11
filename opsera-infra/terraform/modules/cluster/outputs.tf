output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = local.cluster_name
}

output "cluster_endpoint" {
  description = "Kubernetes API server endpoint"
  value = (
    var.cloud_provider == "aws" && length(aws_eks_cluster.main) > 0 ? aws_eks_cluster.main[0].endpoint :
    var.cloud_provider == "gcp" && length(google_container_cluster.main) > 0 ? "https://${google_container_cluster.main[0].endpoint}" :
    var.cloud_provider == "azure" && length(azurerm_kubernetes_cluster.main) > 0 ? azurerm_kubernetes_cluster.main[0].kube_config[0].host :
    ""
  )
  sensitive = true
}

output "cluster_ca_certificate" {
  description = "Cluster CA certificate (base64)"
  value = (
    var.cloud_provider == "aws" && length(aws_eks_cluster.main) > 0 ? aws_eks_cluster.main[0].certificate_authority[0].data :
    var.cloud_provider == "gcp" && length(google_container_cluster.main) > 0 ? google_container_cluster.main[0].master_auth[0].cluster_ca_certificate :
    var.cloud_provider == "azure" && length(azurerm_kubernetes_cluster.main) > 0 ? azurerm_kubernetes_cluster.main[0].kube_config[0].cluster_ca_certificate :
    ""
  )
  sensitive = true
}

output "oidc_provider_url" {
  description = "OIDC provider URL (for IRSA/Workload Identity)"
  value = (
    var.cloud_provider == "aws" && length(aws_eks_cluster.main) > 0 ?
      trimprefix(aws_eks_cluster.main[0].identity[0].oidc[0].issuer, "https://") :
    var.cloud_provider == "gcp" ?
      "${var.gcp_project_id}.svc.id.goog" :
    ""
  )
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN (AWS only)"
  value       = var.cloud_provider == "aws" && length(aws_iam_openid_connect_provider.eks) > 0 ? aws_iam_openid_connect_provider.eks[0].arn : ""
}

output "kubeconfig_command" {
  description = "CLI command to update local kubeconfig"
  value = (
    var.cloud_provider == "aws" ?
      "aws eks update-kubeconfig --name ${local.cluster_name} --region ${var.region}" :
    var.cloud_provider == "gcp" ?
      "gcloud container clusters get-credentials ${local.cluster_name} --region ${var.region} --project ${var.gcp_project_id}" :
    var.cloud_provider == "azure" ?
      "az aks get-credentials --name ${local.cluster_name} --resource-group ${var.azure_resource_group}" :
    ""
  )
}
