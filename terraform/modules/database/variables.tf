# Database Module Variables
variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

# VPC variables removed - using default VPC (no cost)
# Security is handled via Security Groups with Lambda IP ranges

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
  default     = 10 # Reducido para dev (usar 20+ en prod)
  description = "Allocated storage in GB"
}

variable "max_allocated_storage" {
  type        = number
  default     = 30 # Reducido para dev (usar 100+ en prod)
  description = "Maximum allocated storage for autoscaling"
}

