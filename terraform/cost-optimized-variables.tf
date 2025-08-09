# Variables para configuración optimizada de costos

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
  description = "ID de la hosted zone existente (vacío si no existe)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Nombre del dominio (vacío si no quieres usar dominio custom)"
  type        = string
  default     = ""
}

variable "ssl_certificate_arn" {
  description = "ARN del certificado SSL existente (vacío para crear uno nuevo)"
  type        = string
  default     = ""
}

# Opciones de costo (todas opcionales)
variable "create_vpc" {
  description = "Crear VPC (costo adicional, solo si es necesario)"
  type        = bool
  default     = false
}

variable "enable_cloudfront" {
  description = "Habilitar CloudFront (gratis hasta 1TB/mes)"
  type        = bool
  default     = true
}

variable "enable_ssl" {
  description = "Habilitar certificado SSL (gratis con ACM)"
  type        = bool
  default     = false  # Solo si tienes dominio
}

variable "create_database" {
  description = "Crear base de datos RDS (usar solo en producción)"
  type        = bool
  default     = false
}

variable "enable_basic_monitoring" {
  description = "Habilitar monitoreo básico (gratis hasta cierto límite)"
  type        = bool
  default     = true
}

variable "enable_direct_http" {
  description = "Permitir acceso HTTP directo al EC2"
  type        = bool
  default     = true
}

variable "enable_direct_https" {
  description = "Permitir acceso HTTPS directo al EC2"
  type        = bool
  default     = false
}

# Configuración de red (solo si create_vpc = true)
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24"]  # Solo una subnet para ahorrar
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Cambiar por tu IP específica
}

# Base de datos (solo si create_database = true)
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
  default     = ""
}
