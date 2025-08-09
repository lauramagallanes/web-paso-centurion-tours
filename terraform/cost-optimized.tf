# Configuración optimizada para costos mínimos - Paso Centurión Tours
# Esta configuración reduce costos al máximo manteniendo seguridad básica

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Paso Centurión Tours"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "Laura Magallanes"
      CostOptimized = "true"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_instance" "existing_ec2" {
  instance_id = var.existing_ec2_instance_id
}

data "aws_s3_bucket" "existing_images" {
  bucket = var.existing_s3_bucket_name
}

# OPCIÓN 1: Solo Security Groups mejorados (GRATIS)
# Mejorar security groups existentes sin crear nuevos recursos costosos

# Security Group mejorado para tu EC2 existente
resource "aws_security_group" "web_server_optimized" {
  name_prefix = "${var.project_name}-web-optimized-"
  description = "Optimized security group for existing web server"
  
  # HTTP access (solo si necesitas acceso directo)
  dynamic "ingress" {
    for_each = var.enable_direct_http ? [1] : []
    content {
      description = "HTTP"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
  
  # HTTPS access (solo si necesitas acceso directo)
  dynamic "ingress" {
    for_each = var.enable_direct_https ? [1] : []
    content {
      description = "HTTPS"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
  
  # SSH access (solo desde tu IP)
  ingress {
    description = "SSH from your IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }
  
  # Backend API port (solo interno si usas VPC)
  dynamic "ingress" {
    for_each = var.create_vpc ? [1] : []
    content {
      description = "Backend API internal"
      from_port   = 8080
      to_port     = 8080
      protocol    = "tcp"
      cidr_blocks = [var.vpc_cidr]
    }
  }
  
  # Outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-web-optimized-sg"
  }
}

# OPCIÓN 2: VPC mínima (SOLO si es absolutamente necesario)
resource "aws_vpc" "minimal" {
  count = var.create_vpc ? 1 : 0
  
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project_name}-minimal-vpc"
  }
}

resource "aws_internet_gateway" "minimal" {
  count = var.create_vpc ? 1 : 0
  
  vpc_id = aws_vpc.minimal[0].id
  
  tags = {
    Name = "${var.project_name}-minimal-igw"
  }
}

# Solo una subnet pública (sin privadas para ahorrar costos)
resource "aws_subnet" "public_minimal" {
  count = var.create_vpc ? 1 : 0
  
  vpc_id                  = aws_vpc.minimal[0].id
  cidr_block              = var.public_subnet_cidrs[0]
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.project_name}-public-minimal"
  }
}

resource "aws_route_table" "public_minimal" {
  count = var.create_vpc ? 1 : 0
  
  vpc_id = aws_vpc.minimal[0].id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.minimal[0].id
  }
  
  tags = {
    Name = "${var.project_name}-public-minimal-rt"
  }
}

resource "aws_route_table_association" "public_minimal" {
  count = var.create_vpc ? 1 : 0
  
  subnet_id      = aws_subnet.public_minimal[0].id
  route_table_id = aws_route_table.public_minimal[0].id
}

# OPCIÓN 3: CloudFront básico (GRATIS hasta 1TB/mes)
resource "aws_cloudfront_distribution" "minimal" {
  count = var.enable_cloudfront ? 1 : 0
  
  # Origin directo a tu EC2 (sin ALB para ahorrar costos)
  origin {
    domain_name = var.existing_elastic_ip
    origin_id   = "${var.project_name}-EC2-Direct"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"  # Cambiar a https-only cuando tengas SSL
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  # Origin para S3 (imágenes)
  origin {
    domain_name = var.existing_s3_bucket_domain
    origin_id   = "${var.project_name}-S3"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.minimal[0].cloudfront_access_identity_path
    }
  }
  
  enabled         = true
  is_ipv6_enabled = false  # Deshabilitar IPv6 para simplificar
  
  # Solo alias principal (sin www para simplificar)
  aliases = var.domain_name != "" ? [var.domain_name] : []
  
  # Comportamiento por defecto
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${var.project_name}-EC2-Direct"
    compress               = true
    viewer_protocol_policy = "allow-all"  # Cambiar a redirect-to-https cuando tengas SSL
    
    forwarded_values {
      query_string = true
      headers      = ["Host"]
      
      cookies {
        forward = "all"
      }
    }
    
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }
  
  # Comportamiento para imágenes (mayor caché)
  ordered_cache_behavior {
    path_pattern     = "/images/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${var.project_name}-S3"
    compress         = true
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
  }
  
  # Sin restricciones geográficas
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  # Certificado por defecto (gratis pero no custom domain)
  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == ""
    
    # Solo usar certificado custom si tienes dominio
    dynamic "acm_certificate_arn" {
      for_each = var.domain_name != "" && var.ssl_certificate_arn != "" ? [1] : []
      content {
        acm_certificate_arn      = var.ssl_certificate_arn
        ssl_support_method       = "sni-only"
        minimum_protocol_version = "TLSv1.2_2021"
      }
    }
  }
  
  # Sin WAF para ahorrar costos
  web_acl_id = ""
  
  tags = {
    Name = "${var.project_name}-minimal-cloudfront"
  }
}

resource "aws_cloudfront_origin_access_identity" "minimal" {
  count   = var.enable_cloudfront ? 1 : 0
  comment = "Minimal OAI for ${var.project_name}"
}

# OPCIÓN 4: SSL gratuito solo si tienes dominio
resource "aws_acm_certificate" "minimal" {
  count = var.domain_name != "" && var.enable_ssl ? 1 : 0
  
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name = "${var.project_name}-minimal-cert"
  }
}

# OPCIÓN 5: Base de datos solo si es absolutamente necesaria
# Usar RDS solo en producción, SQLite local en desarrollo
resource "aws_db_instance" "minimal" {
  count = var.create_database && var.environment == "production" ? 1 : 0
  
  identifier = "${var.project_name}-minimal-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"  # Free tier eligible
  
  allocated_storage = 20  # Mínimo para free tier
  storage_type      = "gp2"  # Más barato que gp3
  storage_encrypted = false  # Encryption cuesta extra
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  # Sin VPC para ahorrar costos (usar security group por defecto)
  vpc_security_group_ids = var.create_vpc ? [aws_security_group.db_minimal[0].id] : null
  
  # Backups mínimos
  backup_retention_period = 1  # Mínimo posible
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Sin protección para poder eliminar fácilmente
  skip_final_snapshot = true
  deletion_protection = false
  
  # Sin monitoring adicional
  monitoring_interval = 0
  
  # Sin logs adicionales
  enabled_cloudwatch_logs_exports = []
  
  tags = {
    Name = "${var.project_name}-minimal-db"
  }
}

# Security group para DB (solo si usas VPC)
resource "aws_security_group" "db_minimal" {
  count = var.create_vpc && var.create_database ? 1 : 0
  
  name_prefix = "${var.project_name}-db-minimal-"
  vpc_id      = aws_vpc.minimal[0].id
  description = "Minimal security group for database"
  
  ingress {
    description = "PostgreSQL from EC2"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  tags = {
    Name = "${var.project_name}-db-minimal-sg"
  }
}

# S3 bucket policy para CloudFront (gratis)
resource "aws_s3_bucket_policy" "minimal" {
  count  = var.enable_cloudfront ? 1 : 0
  bucket = var.existing_s3_bucket_name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.minimal[0].iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${data.aws_s3_bucket.existing_images.arn}/*"
      }
    ]
  })
}

# Route 53 records (solo si ya tienes hosted zone)
resource "aws_route53_record" "minimal" {
  count = var.existing_hosted_zone_id != "" && var.enable_cloudfront ? 1 : 0
  
  zone_id = var.existing_hosted_zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.minimal[0].domain_name
    zone_id                = aws_cloudfront_distribution.minimal[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# CloudWatch alarm básico (gratis hasta cierto límite)
resource "aws_cloudwatch_metric_alarm" "high_cpu_minimal" {
  count = var.enable_basic_monitoring ? 1 : 0
  
  alarm_name          = "${var.project_name}-high-cpu-minimal"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"  # Más períodos para evitar falsas alarmas
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "600"  # 10 minutos para reducir costs
  statistic           = "Average"
  threshold           = "90"   # Umbral más alto
  alarm_description   = "High CPU utilization on EC2 instance"
  
  dimensions = {
    InstanceId = var.existing_ec2_instance_id
  }
  
  tags = {
    Name = "${var.project_name}-cpu-alarm-minimal"
  }
}
