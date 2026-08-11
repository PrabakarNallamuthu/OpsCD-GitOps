# ── AWS EKS — Dev environment ─────────────────────────────────────────────────
cloud_provider     = "aws"
region             = "us-east-1"
kubernetes_version = "1.29"

availability_zones   = ["us-east-1a", "us-east-1b"]
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

system_node_count      = 2
workload_node_min      = 2
workload_node_max      = 6
system_instance_type   = "m5.large"
workload_instance_type = "m5.xlarge"
