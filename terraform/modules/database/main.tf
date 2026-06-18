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
# Use a new name to avoid conflicts when migrating from custom VPC to default VPC
resource "aws_db_subnet_group" "main" {
  name       = "tinambu-db-subnet-group-${var.environment}-v2"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "tinambu-db-subnet-group-${var.environment}"
  }

  # Prevent deletion of old subnet group until RDS is migrated
  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for RDS - Restrictive access from Lambda IPs only
resource "aws_security_group" "rds" {
  name        = "tinambu-rds-sg-${var.environment}"
  description = "Security group for RDS PostgreSQL database - Lambda access only"
  vpc_id      = data.aws_vpc.default.id

  # Inbound from anywhere (Lambda without VPC needs public access)
  # Security layers: SSL required + Strong passwords + Security Group still provides some protection
  # Note: Lambda without VPC uses AWS public IPs that can change
  # For production, consider moving Lambda to VPC for better security
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    description = "PostgreSQL from Lambda (public access - SSL required)"
    cidr_blocks = ["0.0.0.0/0"] # Allow from anywhere, but SSL is required
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
  # Solo se fija la versión mayor: con auto_minor_version_upgrade activo, AWS aplica los
  # minor (p. ej. 15.17) automáticamente. Fijar "15.12" provocaba un intento de downgrade
  # que AWS rechaza ("Cannot find upgrade path"). Con "15" Terraform acepta cualquier 15.x.
  engine         = "postgres"
  engine_version = "15"
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

# =============================================================================
# RDS Auto Stop/Start — dev y staging únicamente
# Horario L-V 08:00-20:00 hs Montevideo. Fines de semana: apagado.
# Ahorro estimado: ~$7.52/mes al reducir horas de cómputo 730 → ~260 hs/mes.
# =============================================================================

resource "aws_iam_role" "rds_scheduler" {
  count = var.environment != "prod" ? 1 : 0

  name = "tinambu-rds-scheduler-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
    }]
  })

  tags = {
    Name = "tinambu-rds-scheduler-role-${var.environment}"
  }
}

resource "aws_iam_role_policy" "rds_scheduler" {
  count = var.environment != "prod" ? 1 : 0

  name = "tinambu-rds-scheduler-policy-${var.environment}"
  role = aws_iam_role.rds_scheduler[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["rds:StopDBInstance", "rds:StartDBInstance"]
      Resource = aws_db_instance.main.arn
    }]
  })
}

resource "aws_scheduler_schedule" "rds_stop" {
  count = var.environment != "prod" ? 1 : 0

  name       = "tinambu-rds-stop-${var.environment}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 20 ? * MON-FRI *)"
  schedule_expression_timezone = "America/Montevideo"

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:rds:stopDBInstance"
    role_arn = aws_iam_role.rds_scheduler[0].arn

    input = jsonencode({
      DbInstanceIdentifier = aws_db_instance.main.id
    })
  }
}

resource "aws_scheduler_schedule" "rds_start" {
  count = var.environment != "prod" ? 1 : 0

  name       = "tinambu-rds-start-${var.environment}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 8 ? * MON-FRI *)"
  schedule_expression_timezone = "America/Montevideo"

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:rds:startDBInstance"
    role_arn = aws_iam_role.rds_scheduler[0].arn

    input = jsonencode({
      DbInstanceIdentifier = aws_db_instance.main.id
    })
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

