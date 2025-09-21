# Storage Module Outputs
output "frontend_bucket_id" {
  value       = aws_s3_bucket.frontend.id
  description = "Frontend S3 bucket ID"
}

output "frontend_bucket_arn" {
  value       = aws_s3_bucket.frontend.arn
  description = "Frontend S3 bucket ARN"
}

output "frontend_bucket_website_endpoint" {
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
  description = "Frontend S3 bucket website endpoint"
}

output "frontend_bucket_website_domain" {
  value       = aws_s3_bucket_website_configuration.frontend.website_domain
  description = "Frontend S3 bucket website domain"
}

output "public_assets_bucket_id" {
  value       = aws_s3_bucket.public_assets.id
  description = "Public assets S3 bucket ID"
}

output "public_assets_bucket_arn" {
  value       = aws_s3_bucket.public_assets.arn
  description = "Public assets S3 bucket ARN"
}

output "private_backups_bucket_id" {
  value       = aws_s3_bucket.private_backups.id
  description = "Private backups S3 bucket ID"
}

output "cloudfront_logs_bucket_id" {
  value       = aws_s3_bucket.cloudfront_logs.id
  description = "CloudFront logs S3 bucket ID"
}

output "cloudfront_logs_bucket_domain_name" {
  value       = aws_s3_bucket.cloudfront_logs.bucket_domain_name
  description = "CloudFront logs S3 bucket domain name"
}

