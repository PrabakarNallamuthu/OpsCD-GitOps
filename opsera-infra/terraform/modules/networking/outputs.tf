output "vpc_id" {
  description = "VPC/VNet ID"
  value = (
    var.cloud_provider == "aws" ? (length(aws_vpc.main) > 0 ? aws_vpc.main[0].id : "") :
    var.cloud_provider == "gcp" ? (length(google_compute_network.main) > 0 ? google_compute_network.main[0].id : "") :
    var.cloud_provider == "azure" ? (length(azurerm_virtual_network.main) > 0 ? azurerm_virtual_network.main[0].id : "") :
    ""
  )
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value = (
    var.cloud_provider == "aws" ? [for s in aws_subnet.private : s.id] :
    var.cloud_provider == "gcp" ? [for s in google_compute_subnetwork.private : s.id] :
    var.cloud_provider == "azure" ? [for s in azurerm_subnet.private : s.id] :
    []
  )
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value = (
    var.cloud_provider == "aws" ? [for s in aws_subnet.public : s.id] :
    var.cloud_provider == "azure" ? [for s in azurerm_subnet.public : s.id] :
    []
  )
}

output "cluster_security_group_id" {
  description = "Cluster security group ID (AWS only)"
  value       = var.cloud_provider == "aws" && length(aws_security_group.cluster) > 0 ? aws_security_group.cluster[0].id : ""
}

output "node_security_group_id" {
  description = "Node group security group ID (AWS only)"
  value       = var.cloud_provider == "aws" && length(aws_security_group.nodes) > 0 ? aws_security_group.nodes[0].id : ""
}

output "gcp_subnetwork_name" {
  description = "GCP subnetwork name (GCP only)"
  value       = var.cloud_provider == "gcp" && length(google_compute_subnetwork.private) > 0 ? google_compute_subnetwork.private[0].name : ""
}

output "gcp_pods_range_name" {
  description = "Secondary range name for GKE pods (GCP only)"
  value       = "pods"
}

output "gcp_services_range_name" {
  description = "Secondary range name for GKE services (GCP only)"
  value       = "services"
}
