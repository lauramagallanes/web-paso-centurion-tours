# Development Environment Configuration

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  backend "s3" {
    bucket         = "tinambu-terraform-state-1755786555"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "tinambu-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "tinambu-tours"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Storage Module
module "storage" {
  source = "../../modules/storage"

  environment = var.environment
  region      = var.aws_region
}

# Database Module - Must be created before Serverless (no VPC dependencies)
module "database" {
  source = "../../modules/database"

  environment = var.environment
  # VPC variables removed - using default VPC (no cost)
}

# Serverless Module - Lambda without VPC (no ENI costs)
module "serverless" {
  source = "../../modules/serverless"

  environment = var.environment
  region      = var.aws_region
  # VPC variables removed - Lambda runs without VPC
  db_endpoint                         = module.database.db_endpoint
  db_name                             = module.database.db_name
  db_user                             = module.database.db_username
  s3_public_assets_bucket             = module.storage.public_assets_bucket_id
  domain_name                         = var.domain_name
  api_domain_name                     = var.api_domain_name
  lambda_zip_path                     = var.lambda_zip_path
  enable_advanced_payment_integration = var.enable_advanced_payment_integration
}

# Security Module
module "security" {
  source = "../../modules/security"

  environment      = var.environment
  region           = var.aws_region
  enable_guardduty = var.enable_guardduty
  enable_config    = var.enable_config
  enable_waf       = var.enable_waf
}

# Monitoring Module
module "monitoring" {
  source = "../../modules/monitoring"

  environment            = var.environment
  api_gateway_id         = module.serverless.api_gateway_id
  lambda_function_name   = module.serverless.lambda_function_name
  db_instance_identifier = module.database.db_name
  budget_limit           = var.environment == "dev" ? 15 : (var.environment == "staging" ? 30 : 100) # Reducido para dev optimizado
}

# SES Notifications Module - Bounce and Complaint Handling
module "ses_notifications" {
  source = "../../modules/ses-notifications"

  environment          = var.environment
  ses_domain_identity  = var.ses_domain_identity
  ses_email_identities = var.ses_email_identities
}

module "ses_email_forwarding" {
  source = "../../modules/ses-email-forwarding"

  environment       = var.environment
  destination_email = "pasocenturiontours@gmail.com"
  from_email        = "noreply@pasocenturion.com.uy"
}
