# Database Module Outputs
output "db_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
}

output "db_port" {
  value       = aws_db_instance.main.port
  description = "RDS instance port"
}

output "db_name" {
  value       = aws_db_instance.main.db_name
  description = "Database name"
}

output "db_username" {
  value       = aws_db_instance.main.username
  description = "Database master username"
}

output "db_security_group_id" {
  value       = aws_security_group.rds.id
  description = "Database security group ID"
}

output "ssm_parameter_db_password_name" {
  value       = aws_ssm_parameter.db_password.name
  description = "SSM parameter name for database password"
}

