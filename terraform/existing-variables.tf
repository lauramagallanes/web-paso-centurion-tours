# Variables para infraestructura existente de Paso Centurión Tours

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "paso-centurion-tours"
}

# Infraestructura existente
variable "existing_ec2_instance_id" {
  description = "ID de la instancia EC2 existente"
  type        = string
}

variable "existing_elastic_ip" {
  description = "IP elástica existente"
  type        = string
}

variable "existing_s3_bucket_name" {
  description = "Nombre del bucket S3 existente para imágenes"
  type        = string
}

variable "existing_s3_bucket_domain" {
  description = "Domain name del bucket S3 existente"
  type        = string
}

variable "existing_hosted_zone_id" {
  description = "ID de la hosted zone existente (si existe)"
  type        = string
  default     = ""
}

# Dominio
variable "domain_name" {
  description = "Nombre del dominio"
  type        = string
  default     = "pasocenturion.com.uy"
}

variable "create_hosted_zone" {
  description = "Crear nueva hosted zone en Route 53"
  type        = bool
  default     = false
}

# Red
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Cambiar por tu IP específica
}

# Base de datos
variable "create_database" {
  description = "Whether to create RDS database"
  type        = bool
  default     = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15.4"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "pasocenturiondb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Database backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Database maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# Seguridad
variable "enable_waf" {
  description = "Enable WAF protection"
  type        = bool
  default     = true
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution"
  type        = bool
  default     = true
}

variable "enable_alb" {
  description = "Enable Application Load Balancer"
  type        = bool
  default     = true
}

# Monitoreo
variable "enable_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# Certificados SSL
variable "ssl_policy" {
  description = "SSL policy for load balancer"
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
}

# Backup
variable "enable_automated_backups" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

# Tags adicionales
variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
