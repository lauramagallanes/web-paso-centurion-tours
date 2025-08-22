# AWS Budgets Configuration

# Monthly Cost Budget
resource "aws_budgets_budget" "monthly_cost" {
  name              = "tinambu-monthly-budget-${var.environment}"
  budget_type       = "COST"
  limit_amount      = var.budget_limit
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2024-01-01_00:00"

  # Alert at 80% of budget
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = []
    subscriber_sns_topic_arns  = [aws_sns_topic.alerts.arn]
  }

  # Alert at 100% of budget
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = []
    subscriber_sns_topic_arns  = [aws_sns_topic.alerts.arn]
  }

  # Forecasted spend alert at 100%
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = []
    subscriber_sns_topic_arns  = [aws_sns_topic.alerts.arn]
  }

  tags = {
    Name = "tinambu-monthly-budget-${var.environment}"
  }
}

# Lambda Usage Budget (for cost control)
resource "aws_budgets_budget" "lambda_usage" {
  count = var.environment == "prod" ? 1 : 0

  name              = "tinambu-lambda-budget-${var.environment}"
  budget_type       = "USAGE"
  limit_amount      = "1000000" # 1M requests
  limit_unit        = "None"
  time_unit         = "MONTHLY"
  time_period_start = "2024-01-01_00:00"



  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = []
    subscriber_sns_topic_arns  = [aws_sns_topic.alerts.arn]
  }

  tags = {
    Name = "tinambu-lambda-budget-${var.environment}"
  }
}

