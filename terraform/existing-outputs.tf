# Outputs para infraestructura existente

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

output "nat_gateway_ip" {
  description = "Public IP of the NAT Gateway"
  value       = aws_eip.nat.public_ip
}

# Load Balancer
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.web.arn
}

# CloudFront
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

# Security Groups
output "web_server_security_group_id" {
  description = "ID of the web server security group"
  value       = aws_security_group.web_server.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

# SSL Certificate
output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = aws_acm_certificate.main.arn
}

output "ssl_certificate_status" {
  description = "Status of the SSL certificate"
  value       = aws_acm_certificate.main.status
}

# WAF
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

# Route 53
output "hosted_zone_id" {
  description = "ID of the hosted zone"
  value       = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : var.existing_hosted_zone_id
}

output "hosted_zone_name_servers" {
  description = "Name servers of the hosted zone"
  value       = var.create_hosted_zone ? aws_route53_zone.main[0].name_servers : []
}

# Database outputs (if created)
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

# S3 Buckets
output "alb_logs_bucket" {
  description = "S3 bucket for ALB logs"
  value       = aws_s3_bucket.alb_logs.id
}

output "existing_s3_bucket" {
  description = "Existing S3 bucket for images"
  value       = var.existing_s3_bucket_name
}

# Application URLs
output "application_url" {
  description = "Main application URL"
  value       = "https://${var.domain_name}"
}

output "www_url" {
  description = "WWW application URL"
  value       = "https://www.${var.domain_name}"
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

# GitHub Actions secrets
output "github_actions_secrets" {
  description = "Required GitHub Actions secrets"
  value = {
    AWS_ACCESS_KEY_ID     = "Configure with IAM user access key"
    AWS_SECRET_ACCESS_KEY = "Configure with IAM user secret key"
    EC2_HOST             = var.existing_elastic_ip
    EC2_INSTANCE_ID      = var.existing_ec2_instance_id
    S3_IMAGES_BUCKET     = var.existing_s3_bucket_name
    CLOUDFRONT_DISTRIBUTION_ID = aws_cloudfront_distribution.main.id
    ALB_TARGET_GROUP_ARN = aws_lb_target_group.web.arn
    DB_HOST              = var.create_database ? aws_db_instance.main[0].endpoint : "Not created"
    DB_NAME              = var.create_database ? aws_db_instance.main[0].db_name : "Not created"
    DB_USERNAME          = var.create_database ? aws_db_instance.main[0].username : "Not created"
    DB_PASSWORD          = "Configure with database password"
    DOMAIN_NAME          = var.domain_name
    SSL_CERTIFICATE_ARN  = aws_acm_certificate.main.arn
  }
}

# Security summary
output "security_features" {
  description = "Security features implemented"
  value = {
    vpc_with_private_subnets = true
    nat_gateway             = true
    security_groups         = true
    waf_protection         = var.enable_waf
    ssl_encryption         = true
    cloudfront_protection  = var.enable_cloudfront
    alb_security          = var.enable_alb
    database_private      = var.create_database
    automated_backups     = var.enable_automated_backups
  }
}

# Infrastructure summary
output "infrastructure_summary" {
  description = "Summary of infrastructure"
  value = {
    environment     = var.environment
    region         = var.aws_region
    domain         = var.domain_name
    vpc_cidr       = var.vpc_cidr
    existing_ec2   = var.existing_ec2_instance_id
    existing_eip   = var.existing_elastic_ip
    existing_s3    = var.existing_s3_bucket_name
    database_created = var.create_database
    waf_enabled    = var.enable_waf
    cloudfront_enabled = var.enable_cloudfront
    ssl_enabled    = true
  }
}
