# Production Environment Outputs

# API Gateway
output "api_base_url" {
  value       = module.serverless.api_base_url
  description = "API Gateway base URL"
}

# Database
output "db_host" {
  value       = module.database.db_endpoint
  description = "RDS instance endpoint"
}

output "db_port" {
  value       = module.database.db_port
  description = "Database port"
}

output "db_name" {
  value       = module.database.db_name
  description = "Database name"
}

output "db_user" {
  value       = module.database.db_username
  description = "Database username"
}

output "ssm_parameter_db_password_name" {
  value       = module.database.ssm_parameter_db_password_name
  description = "SSM parameter name for DB password"
}

# PlacetoPay Payment Links Specific Outputs
output "payment_webhook_url" {
  value       = module.serverless.payment_webhook_url
  description = "Webhook URL for Payment Links notifications"
}

output "payment_status_endpoint" {
  value       = module.serverless.payment_status_endpoint
  description = "GET endpoint for payment status queries"
}

output "payment_create_endpoint" {
  value       = module.serverless.payment_create_endpoint
  description = "POST endpoint for link creation (Advanced mode only)"
}

# Network Troubleshooting Outputs - REMOVED (no VPC)
# output "nat_instance_public_ip" {
#   value       = module.networking.nat_instance_public_ip
#   description = "NAT Instance Elastic IP for troubleshooting"
# }

# VPC Information - REMOVED (using default VPC, no custom VPC)
# output "vpc_id" {
#   value       = module.networking.vpc_id
#   description = "VPC ID"
# }

# Storage
output "frontend_bucket_id" {
  value       = module.storage.frontend_bucket_id
  description = "Frontend S3 bucket ID"
}

output "public_assets_bucket_id" {
  value       = module.storage.public_assets_bucket_id
  description = "Public assets S3 bucket ID"
}

# Monitoring
output "sns_topic_arn" {
  value       = module.monitoring.sns_topic_arn
  description = "SNS topic ARN for alerts"
}

