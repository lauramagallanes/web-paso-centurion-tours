# Production Environment Variables

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region"
}

variable "environment" {
  type        = string
  default     = "prod"
  description = "Environment name"
}

variable "availability_zones" {
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
  description = "Availability zones"
}

variable "domain_name" {
  type        = string
  description = "Domain name for the application"
}

variable "api_domain_name" {
  type        = string
  description = "API domain name"
}

# Production can enable additional services based on budget
variable "enable_interface_endpoints" {
  type        = bool
  default     = false # Can be set to true if budget allows
  description = "Enable VPC Interface Endpoints (SSM, KMS) - additional cost ~$22/month each"
}

variable "enable_guardduty" {
  type        = bool
  default     = false # Can be set to true for enhanced security
  description = "Enable GuardDuty threat detection - additional cost ~$3-5/month"
}

variable "enable_config" {
  type        = bool
  default     = false # Can be set to true for compliance
  description = "Enable AWS Config compliance monitoring - additional cost ~$2-4/month"
}

variable "enable_waf" {
  type        = bool
  default     = false # Can be set to true for additional protection
  description = "Enable WAF web application firewall - additional cost ~$5-10/month"
}

variable "enable_advanced_payment_integration" {
  type        = bool
  default     = true
  description = "Enable advanced PlacetoPay integration (create payment links)"
}

# Lambda deployment
variable "lambda_zip_path" {
  type        = string
  description = "Path to Lambda deployment ZIP file"
  default     = "../../backend/target/tinambu-tours-lambda.zip"
}

