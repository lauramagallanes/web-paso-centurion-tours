output "bounce_topic_arn" {
  description = "ARN of the SNS topic for bounce notifications"
  value       = aws_sns_topic.ses_bounces.arn
}

output "complaint_topic_arn" {
  description = "ARN of the SNS topic for complaint notifications"
  value       = aws_sns_topic.ses_complaints.arn
}

output "bounce_handler_function_name" {
  description = "Name of the Lambda function handling bounces"
  value       = aws_lambda_function.ses_bounce_handler.function_name
}

output "complaint_handler_function_name" {
  description = "Name of the Lambda function handling complaints"
  value       = aws_lambda_function.ses_complaint_handler.function_name
}


