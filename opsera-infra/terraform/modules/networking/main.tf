terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      WO          = "WO-001"
    },
    var.tags
  )
}

# ── AWS: VPC + Subnets + NAT Gateway ─────────────────────────────────────────
resource "aws_vpc" "main" {
  count = var.cloud_provider == "aws" ? 1 : 0

  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_internet_gateway" "main" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  vpc_id = aws_vpc.main[0].id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-igw" })
}

resource "aws_subnet" "public" {
  count = var.cloud_provider == "aws" ? length(var.public_subnet_cidrs) : 0

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name                     = "${local.name_prefix}-public-${count.index + 1}"
    "kubernetes.io/role/elb" = "1"
  })
}

resource "aws_subnet" "private" {
  count = var.cloud_provider == "aws" ? length(var.private_subnet_cidrs) : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name                              = "${local.name_prefix}-private-${count.index + 1}"
    "kubernetes.io/role/internal-elb" = "1"
  })
}

resource "aws_eip" "nat" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  domain = "vpc"
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-nat-eip" })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = var.cloud_provider == "aws" ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-nat" })
  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-rt-public" })
}

resource "aws_route_table" "private" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-rt-private" })
}

resource "aws_route_table_association" "public" {
  count          = var.cloud_provider == "aws" ? length(aws_subnet.public) : 0
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_route_table_association" "private" {
  count          = var.cloud_provider == "aws" ? length(aws_subnet.private) : 0
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}

resource "aws_security_group" "cluster" {
  count       = var.cloud_provider == "aws" ? 1 : 0
  name        = "${local.name_prefix}-cluster-sg"
  description = "EKS cluster control plane security group"
  vpc_id      = aws_vpc.main[0].id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-cluster-sg" })
}

resource "aws_security_group" "nodes" {
  count       = var.cloud_provider == "aws" ? 1 : 0
  name        = "${local.name_prefix}-nodes-sg"
  description = "EKS node group security group"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    self            = true
    description     = "Allow intra-node communication"
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.cluster[0].id]
    description     = "Allow control plane to nodes"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-nodes-sg" })
}

# ── GCP: VPC + Subnets ────────────────────────────────────────────────────────
resource "google_compute_network" "main" {
  count                   = var.cloud_provider == "gcp" ? 1 : 0
  project                 = var.gcp_project_id
  name                    = "${local.name_prefix}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "private" {
  count         = var.cloud_provider == "gcp" ? 1 : 0
  project       = var.gcp_project_id
  name          = "${local.name_prefix}-private"
  ip_cidr_range = var.private_subnet_cidrs[0]
  region        = var.region
  network       = google_compute_network.main[0].id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "192.168.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "172.16.0.0/16"
  }

  private_ip_google_access = true
}

resource "google_compute_router" "main" {
  count   = var.cloud_provider == "gcp" ? 1 : 0
  project = var.gcp_project_id
  name    = "${local.name_prefix}-router"
  region  = var.region
  network = google_compute_network.main[0].id
}

resource "google_compute_router_nat" "main" {
  count                              = var.cloud_provider == "gcp" ? 1 : 0
  project                            = var.gcp_project_id
  name                               = "${local.name_prefix}-nat"
  router                             = google_compute_router.main[0].name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# ── Azure: VNet + Subnets ─────────────────────────────────────────────────────
resource "azurerm_virtual_network" "main" {
  count               = var.cloud_provider == "azure" ? 1 : 0
  name                = "${local.name_prefix}-vnet"
  resource_group_name = var.azure_resource_group
  location            = var.region
  address_space       = [var.vpc_cidr]
  tags                = local.common_tags
}

resource "azurerm_subnet" "private" {
  count                = var.cloud_provider == "azure" ? length(var.private_subnet_cidrs) : 0
  name                 = "${local.name_prefix}-private-${count.index + 1}"
  resource_group_name  = var.azure_resource_group
  virtual_network_name = azurerm_virtual_network.main[0].name
  address_prefixes     = [var.private_subnet_cidrs[count.index]]
}

resource "azurerm_subnet" "public" {
  count                = var.cloud_provider == "azure" ? length(var.public_subnet_cidrs) : 0
  name                 = "${local.name_prefix}-public-${count.index + 1}"
  resource_group_name  = var.azure_resource_group
  virtual_network_name = azurerm_virtual_network.main[0].name
  address_prefixes     = [var.public_subnet_cidrs[count.index]]
}
