# Serverless Module Variables
variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

variable "region" {
  type        = string
  description = "AWS region"
}

variable "project_name" {
  type        = string
  default     = "tinambu-tours"
  description = "Project name"
}

# VPC variables removed - Lambda runs without VPC (no cost)
# Security is handled via RDS Security Groups with Lambda IP ranges

variable "db_endpoint" {
  type        = string
  description = "Database endpoint"
}

variable "db_name" {
  type        = string
  description = "Database name"
}

variable "db_user" {
  type        = string
  description = "Database username"
}

variable "s3_public_assets_bucket" {
  type        = string
  description = "S3 bucket for public assets"
}

variable "domain_name" {
  type        = string
  description = "Domain name for the application"
}

variable "api_domain_name" {
  type        = string
  description = "API domain name"
}

variable "lambda_zip_path" {
  type        = string
  description = "Path to Lambda deployment ZIP file"
}

variable "enable_advanced_payment_integration" {
  type        = bool
  default     = false
  description = "Enable advanced PlacetoPay integration (create payment links)"
}

