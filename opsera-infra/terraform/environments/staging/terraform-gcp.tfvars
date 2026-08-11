# ── GCP GKE — Dev environment ─────────────────────────────────────────────────
cloud_provider     = "gcp"
region             = "us-central1"
kubernetes_version = "1.29"
gcp_project_id     = "your-gcp-project-id"  # Replace with actual GCP project

availability_zones   = ["us-central1-a", "us-central1-b"]
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

system_node_count      = 2
workload_node_min      = 2
workload_node_max      = 6
