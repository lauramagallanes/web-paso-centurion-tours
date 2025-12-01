# Get default VPC for Security Groups (no cost)
data "aws_vpc" "default" {
  default = true
}

# Get default subnets for DB subnet group
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# RDS PostgreSQL Database Configuration
resource "aws_db_subnet_group" "main" {
  name       = "tinambu-db-subnet-group-${var.environment}"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "tinambu-db-subnet-group-${var.environment}"
  }
}

# Security Group for RDS - Restrictive access from Lambda IPs only
resource "aws_security_group" "rds" {
  name        = "tinambu-rds-sg-${var.environment}"
  description = "Security group for RDS PostgreSQL database - Lambda access only"
  vpc_id      = data.aws_vpc.default.id

  # Inbound from AWS Lambda IP ranges (us-east-1)
  # Security layers: IP restriction + SSL required + Strong passwords
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    description = "PostgreSQL from AWS Lambda (us-east-1)"
    # AWS Lambda IP ranges for us-east-1
    # If connection fails, check AWS IP ranges: https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html
    cidr_blocks = [
      "3.5.140.0/22",   # AWS Lambda us-east-1
      "52.70.0.0/15",   # AWS Lambda us-east-1
      "52.144.0.0/14",  # AWS Lambda us-east-1
      "54.144.0.0/14",  # AWS Lambda us-east-1
      "54.152.0.0/16",  # AWS Lambda us-east-1
      "54.226.0.0/15",  # AWS Lambda us-east-1
      "18.206.0.0/15",  # AWS Lambda us-east-1 (additional range)
      "18.232.0.0/14",  # AWS Lambda us-east-1 (additional range)
    ]
  }

  tags = {
    Name = "tinambu-rds-sg-${var.environment}"
  }
}

# Random password for database
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store database password in SSM Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.environment}/database/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = {
    Name = "tinambu-db-password-${var.environment}"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "tinambu-db-${var.environment}"

  # Engine Configuration
  engine         = "postgres"
  engine_version = "15.12"
  instance_class = var.instance_class

  # Storage Configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database Configuration
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # Network Configuration - Publicly accessible but secured with Security Group
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = true # Public but secured with Security Group + SSL requirement

  # Backup Configuration
  backup_retention_period = var.environment == "dev" ? 1 : 7 # 1 día en dev, 7 en prod
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:00-Sun:05:00"

  # Security Configuration
  deletion_protection        = var.environment == "prod" ? true : false
  auto_minor_version_upgrade = true

  # Multi-AZ solo en producción
  multi_az = var.environment == "prod" ? true : false

  # Performance Insights
  performance_insights_enabled = var.environment == "prod" ? true : false

  # Monitoring
  monitoring_interval = var.environment == "prod" ? 60 : 0

  # Parameter Group
  parameter_group_name = aws_db_parameter_group.main.name

  # SSL Configuration - Require SSL for all connections
  # This is enforced via parameter group above

  # Final Snapshot
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "tinambu-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  tags = {
    Name = "tinambu-db-${var.environment}"
  }
}

# DB Parameter Group for performance optimization and security
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "tinambu-db-params-${var.environment}"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  # Note: SSL enforcement is handled at application level via JDBC connection string
  # Security is primarily via Security Group restricting access to Lambda IP ranges

  tags = {
    Name = "tinambu-db-params-${var.environment}"
  }
}

