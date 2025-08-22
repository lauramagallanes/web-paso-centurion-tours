# Terraform State Backend Configuration
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "tinambu-terraform-state-${var.environment}"
    key            = "infrastructure/terraform.tfstate"
    region         = var.aws_region
    encrypt        = true
    dynamodb_table = "tinambu-terraform-lock-${var.environment}"
  }
}

# AWS Provider Configuration
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

