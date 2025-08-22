# Security Module Variables
variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

variable "region" {
  type        = string
  description = "AWS region"
}

variable "enable_guardduty" {
  type        = bool
  default     = false
  description = "Enable GuardDuty threat detection (additional cost)"
}

variable "enable_config" {
  type        = bool
  default     = false
  description = "Enable AWS Config compliance monitoring (additional cost)"
}

variable "enable_waf" {
  type        = bool
  default     = false
  description = "Enable WAF web application firewall (additional cost)"
}

