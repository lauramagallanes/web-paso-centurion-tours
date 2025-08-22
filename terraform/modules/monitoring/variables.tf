# Monitoring Module Variables
variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

variable "project_name" {
  type        = string
  default     = "tinambu-tours"
  description = "Project name"
}

variable "api_gateway_id" {
  type        = string
  description = "API Gateway ID for monitoring"
}

variable "lambda_function_name" {
  type        = string
  description = "Lambda function name for monitoring"
}

variable "db_instance_identifier" {
  type        = string
  description = "RDS instance identifier for monitoring"
}

variable "sns_topic_arn" {
  type        = string
  description = "SNS topic ARN for alerts"
  default     = ""
}

variable "budget_limit" {
  type        = number
  description = "Monthly budget limit in USD"
  default     = 50
}

