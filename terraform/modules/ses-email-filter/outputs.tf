output "filter_lambda_arn" {
  description = "ARN of the email filter Lambda function"
  value       = aws_lambda_function.email_filter.arn
}

output "filter_lambda_name" {
  description = "Name of the email filter Lambda function"
  value       = aws_lambda_function.email_filter.function_name
}

output "blocklist_ssm_parameter_name" {
  description = "SSM Parameter Store key for the email blocklist"
  value       = aws_ssm_parameter.email_blocklist.name
}

output "receipt_rule_set_name" {
  description = "Name of the active SES Receipt Rule Set"
  value       = aws_ses_receipt_rule_set.main.rule_set_name
}
