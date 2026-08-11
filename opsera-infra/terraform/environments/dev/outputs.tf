output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = module.cluster.cluster_name
}

output "kubeconfig_command" {
  description = "CLI command to configure kubectl"
  value       = module.cluster.kubeconfig_command
}

output "namespace_names" {
  description = "Provisioned trust-zone namespaces"
  value       = module.namespaces.namespace_names
}

output "oidc_provider_url" {
  description = "OIDC provider URL for IRSA/Workload Identity"
  value       = module.cluster.oidc_provider_url
}
