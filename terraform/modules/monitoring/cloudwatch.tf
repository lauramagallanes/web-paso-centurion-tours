# CloudWatch Monitoring Configuration

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "tinambu-alerts-${var.environment}"

  tags = {
    Name = "tinambu-alerts-${var.environment}"
  }
}

# CloudWatch Alarms for API Gateway
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  alarm_name          = "tinambu-apigw-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors API Gateway 5xx errors"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName = "tinambu-api-${var.environment}"
  }

  tags = {
    Name = "tinambu-apigw-5xx-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_high_latency" {
  alarm_name          = "tinambu-apigw-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000" # 10 seconds
  alarm_description   = "This metric monitors API Gateway high latency"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName = "tinambu-api-${var.environment}"
  }

  tags = {
    Name = "tinambu-apigw-latency-${var.environment}"
  }
}

# CloudWatch Alarms for Lambda
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "tinambu-lambda-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  tags = {
    Name = "tinambu-lambda-errors-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "tinambu-lambda-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "25000" # 25 seconds (close to 30s timeout)
  alarm_description   = "This metric monitors Lambda function duration"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  tags = {
    Name = "tinambu-lambda-duration-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "tinambu-lambda-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors Lambda function throttles"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  tags = {
    Name = "tinambu-lambda-throttles-${var.environment}"
  }
}

# CloudWatch Alarms for RDS
resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "tinambu-rds-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  tags = {
    Name = "tinambu-rds-cpu-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_low_storage" {
  alarm_name          = "tinambu-rds-storage-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000" # 2 GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  tags = {
    Name = "tinambu-rds-storage-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connection_count" {
  alarm_name          = "tinambu-rds-connections-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "15" # 75% of t4g.micro max connections (~20)
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  tags = {
    Name = "tinambu-rds-connections-${var.environment}"
  }
}

# PlacetoPay Payment Links Specific Alarms
resource "aws_cloudwatch_metric_alarm" "payment_webhook_errors" {
  alarm_name          = "tinambu-payment-webhook-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Payment webhook processing errors"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName  = "tinambu-api-${var.environment}"
    Method   = "POST"
    Resource = "/pagos/links/webhook"
  }

  tags = {
    Name = "tinambu-payment-webhook-errors-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "payment_status_query_errors" {
  alarm_name          = "tinambu-payment-status-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "2"
  alarm_description   = "Payment status query failures"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName  = "tinambu-api-${var.environment}"
    Method   = "GET"
    Resource = "/pagos/links/estado"
  }

  tags = {
    Name = "tinambu-payment-status-errors-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "payment_processing_latency" {
  alarm_name          = "tinambu-payment-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000" # 10 seconds
  alarm_description   = "High payment processing latency"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName  = "tinambu-api-${var.environment}"
    Resource = "/pagos/links/*"
  }

  tags = {
    Name = "tinambu-payment-latency-${var.environment}"
  }
}

