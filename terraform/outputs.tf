# Outputs for Paso Centurión Tours Infrastructure

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "web_server_instance_id" {
  description = "ID of the web server instance"
  value       = aws_instance.web_server.id
}

output "web_server_public_ip" {
  description = "Public IP of the web server"
  value       = aws_eip.web_server.public_ip
}

output "web_server_public_dns" {
  description = "Public DNS of the web server"
  value       = aws_eip.web_server.public_dns
}

output "web_server_private_ip" {
  description = "Private IP of the web server"
  value       = aws_instance.web_server.private_ip
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_eip.web_server.public_ip}"
}

output "ssh_connection_command" {
  description = "SSH command to connect to the web server"
  value       = "ssh -i ~/.ssh/${var.project_name}-key.pem ec2-user@${aws_eip.web_server.public_ip}"
}

output "security_group_web_id" {
  description = "ID of the web server security group"
  value       = aws_security_group.web_server.id
}

output "security_group_db_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "s3_deployments_bucket" {
  description = "Name of the S3 bucket for deployments"
  value       = aws_s3_bucket.deployments.id
}

output "s3_deployments_bucket_arn" {
  description = "ARN of the S3 bucket for deployments"
  value       = aws_s3_bucket.deployments.arn
}

output "iam_role_ec2_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "key_pair_name" {
  description = "Name of the EC2 key pair"
  value       = aws_key_pair.main.key_name
}

# Database outputs (conditional)
output "database_endpoint" {
  description = "Database endpoint"
  value       = var.create_database ? aws_db_instance.main[0].endpoint : null
}

output "database_port" {
  description = "Database port"
  value       = var.create_database ? aws_db_instance.main[0].port : null
}

output "database_name" {
  description = "Database name"
  value       = var.create_database ? aws_db_instance.main[0].db_name : null
}

output "database_username" {
  description = "Database username"
  value       = var.create_database ? aws_db_instance.main[0].username : null
  sensitive   = true
}

# GitHub Actions secrets (for easy reference)
output "github_actions_secrets" {
  description = "Required GitHub Actions secrets"
  value = {
    AWS_ACCESS_KEY_ID     = "Configure with IAM user access key"
    AWS_SECRET_ACCESS_KEY = "Configure with IAM user secret key"
    EC2_HOST             = aws_eip.web_server.public_ip
    EC2_SSH_KEY          = "Configure with private key content"
    S3_DEPLOYMENT_BUCKET = aws_s3_bucket.deployments.id
    DB_HOST              = var.create_database ? aws_db_instance.main[0].endpoint : "Not created"
    DB_NAME              = var.create_database ? aws_db_instance.main[0].db_name : "Not created"
    DB_USERNAME          = var.create_database ? aws_db_instance.main[0].username : "Not created"
    DB_PASSWORD          = "Configure with database password"
  }
}

# Summary information
output "infrastructure_summary" {
  description = "Summary of created infrastructure"
  value = {
    environment        = var.environment
    region            = var.aws_region
    vpc_cidr          = var.vpc_cidr
    instance_type     = var.instance_type
    database_created  = var.create_database
    public_ip         = aws_eip.web_server.public_ip
    application_url   = "http://${aws_eip.web_server.public_ip}"
    s3_bucket        = aws_s3_bucket.deployments.id
  }
}
