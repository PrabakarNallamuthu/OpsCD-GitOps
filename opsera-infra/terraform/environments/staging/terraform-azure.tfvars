# ── Azure AKS — Dev environment ───────────────────────────────────────────────
cloud_provider        = "azure"
region                = "eastus"
kubernetes_version    = "1.29"
azure_subscription_id = "your-subscription-id"  # Replace with actual subscription
azure_resource_group  = "opsera-dev-rg"

availability_zones   = ["1", "2"]
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

system_node_count      = 2
workload_node_min      = 2
workload_node_max      = 6
