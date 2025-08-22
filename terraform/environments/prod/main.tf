# Production Environment Configuration

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "tinambu-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "tinambu-terraform-lock-prod"
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

# Networking Module
module "networking" {
  source = "../../modules/networking"

  environment                = var.environment
  region                     = var.aws_region
  availability_zones         = var.availability_zones
  enable_interface_endpoints = var.enable_interface_endpoints
}

# Storage Module
module "storage" {
  source = "../../modules/storage"

  environment = var.environment
  region      = var.aws_region
}

# Serverless Module
module "serverless" {
  source = "../../modules/serverless"

  environment                         = var.environment
  region                              = var.aws_region
  vpc_id                              = module.networking.vpc_id
  private_subnet_ids                  = module.networking.private_subnet_ids
  db_endpoint                         = module.database.db_endpoint
  db_name                             = module.database.db_name
  db_user                             = module.database.db_username
  s3_public_assets_bucket             = module.storage.public_assets_bucket_id
  domain_name                         = var.domain_name
  api_domain_name                     = var.api_domain_name
  lambda_zip_path                     = var.lambda_zip_path
  enable_advanced_payment_integration = var.enable_advanced_payment_integration
}

# Database Module
module "database" {
  source = "../../modules/database"

  environment              = var.environment
  vpc_id                   = module.networking.vpc_id
  private_subnet_ids       = module.networking.private_subnet_ids
  lambda_security_group_id = module.serverless.lambda_security_group_id
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
  budget_limit           = 100
}

