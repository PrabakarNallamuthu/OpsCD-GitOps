# Remote state backend — configured per cloud provider
# Uncomment the appropriate backend block and fill in your values.
# Only ONE backend block may be active at a time.
#
# State locking is mandatory:
#   AWS:   DynamoDB table provides distributed locking
#   GCP:   GCS bucket provides object locking
#   Azure: Azure Blob Storage provides lease-based locking
#
# To initialise: terraform init -backend-config=backend-<provider>.hcl

terraform {
  # ── AWS S3 + DynamoDB ───────────────────────────────────────────────────────
  backend "s3" {
    # Override with: terraform init -backend-config=backend-aws.hcl
    # or set TF_VAR_* / env overrides in CI
    bucket         = "opsera-tfstate-staging"
    key            = "opsera/staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "opsera-tfstate-lock-staging"
    encrypt        = true

    # Enforce server-side encryption — required for compliance
    server_side_encryption_configuration {
      rule {
        apply_server_side_encryption_by_default {
          sse_algorithm = "aws:kms"
        }
      }
    }
  }

  # ── GCP GCS (uncomment to use) ───────────────────────────────────────────────
  # backend "gcs" {
  #   bucket = "opsera-tfstate-staging"
  #   prefix = "opsera/dev"
  # }

  # ── Azure Blob (uncomment to use) ────────────────────────────────────────────
  # backend "azurerm" {
  #   resource_group_name  = "opsera-tfstate-rg"
  #   storage_account_name = "opseratfstatedev"
  #   container_name       = "tfstate"
  #   key                  = "opsera/staging/terraform.tfstate"
  # }
}
