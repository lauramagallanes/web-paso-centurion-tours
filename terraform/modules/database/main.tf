# RDS PostgreSQL Database Configuration
resource "aws_db_subnet_group" "main" {
  name       = "tinambu-db-subnet-group-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "tinambu-db-subnet-group-${var.environment}"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "tinambu-rds-sg-${var.environment}"
  description = "Security group for RDS PostgreSQL database"
  vpc_id      = var.vpc_id

  # Inbound from Lambda only
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.lambda_security_group_id]
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
  engine_version = "15.8"
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

  # Network Configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backup Configuration
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:00-Sun:05:00"

  # Security Configuration
  deletion_protection        = var.environment == "prod" ? true : false
  auto_minor_version_upgrade = true

  # Performance Insights
  performance_insights_enabled = var.environment == "prod" ? true : false

  # Monitoring
  monitoring_interval = var.environment == "prod" ? 60 : 0

  # Parameter Group
  parameter_group_name = aws_db_parameter_group.main.name

  # Final Snapshot
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "tinambu-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  tags = {
    Name = "tinambu-db-${var.environment}"
  }
}

# DB Parameter Group for performance optimization
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

  tags = {
    Name = "tinambu-db-params-${var.environment}"
  }
}

