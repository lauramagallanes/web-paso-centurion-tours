# Monitoring Module Outputs
output "sns_topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "SNS topic ARN for alerts"
}

output "sns_topic_name" {
  value       = aws_sns_topic.alerts.name
  description = "SNS topic name"
}

output "budget_name" {
  value       = aws_budgets_budget.monthly_cost.name
  description = "Monthly budget name"
}

