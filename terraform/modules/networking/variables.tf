# Networking Module Variables
variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

variable "region" {
  type        = string
  description = "AWS region"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "CIDR block for VPC"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones"
}

variable "enable_interface_endpoints" {
  type        = bool
  default     = false
  description = "Enable VPC Interface Endpoints (SSM, KMS) - additional cost"
}

variable "lambda_security_group_id" {
  type        = string
  description = "Security group ID of Lambda functions"
  default     = ""
}

