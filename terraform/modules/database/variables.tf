# Database Module Variables
variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID where database will be created"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for database subnet group"
}

variable "lambda_security_group_id" {
  type        = string
  description = "Security group ID of Lambda functions for database access"
}

variable "db_name" {
  type        = string
  default     = "tinambu_tours"
  description = "Database name"
}

variable "db_username" {
  type        = string
  default     = "tinambu_admin"
  description = "Database master username"
}

variable "instance_class" {
  type        = string
  default     = "db.t4g.micro"
  description = "RDS instance class"
}

variable "allocated_storage" {
  type        = number
  default     = 20
  description = "Allocated storage in GB"
}

variable "max_allocated_storage" {
  type        = number
  default     = 100
  description = "Maximum allocated storage for autoscaling"
}

