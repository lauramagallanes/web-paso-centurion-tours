# Development Environment Variables

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region"
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment name"
}

variable "availability_zones" {
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"] # Mantener 2 AZs (eliminar AZ problemático con Lambda ENIs)
  description = "Availability zones"
}

variable "domain_name" {
  type        = string
  description = "Domain name for the application"
  default     = "dev.pasocenturion.com.uy" # Subdominio dev
}

variable "api_domain_name" {
  type        = string
  description = "API domain name"
  default     = "api-dev.pasocenturion.com.uy" # API dev
}

# Cost-friendly defaults (all optional services disabled)
variable "enable_interface_endpoints" {
  type        = bool
  default     = false
  description = "Enable VPC Interface Endpoints (SSM, KMS) - additional cost ~$22/month each"
}

variable "enable_guardduty" {
  type        = bool
  default     = false
  description = "Enable GuardDuty threat detection - additional cost ~$3-5/month"
}

variable "enable_config" {
  type        = bool
  default     = false
  description = "Enable AWS Config compliance monitoring - additional cost ~$2-4/month"
}

variable "enable_waf" {
  type        = bool
  default     = false
  description = "Enable WAF web application firewall - additional cost ~$5-10/month"
}

variable "enable_advanced_payment_integration" {
  type        = bool
  default     = false
  description = "Enable advanced PlacetoPay integration (create payment links)"
}

# Lambda deployment
variable "lambda_zip_path" {
  type        = string
  description = "Path to Lambda deployment ZIP file"
  default     = "../../../backend/target/tinambu-tours-lambda.zip"
}

# SES Configuration
variable "ses_domain_identity" {
  type        = string
  description = "SES domain identity (e.g., pasocenturion.com.uy)"
  default     = "pasocenturion.com.uy"
}

variable "ses_email_identities" {
  type        = list(string)
  description = "List of verified SES email identities"
  default     = ["tinambu.paso.centurion@gmail.com"]
}
