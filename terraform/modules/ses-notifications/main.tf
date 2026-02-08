# SES Bounce and Complaint Handling Module
# This module sets up SNS topics and Lambda functions to handle SES bounces and complaints
# Required by AWS SES for production access

# SNS Topic for Bounces
resource "aws_sns_topic" "ses_bounces" {
  name = "ses-bounces-${var.environment}"

  tags = {
    Name        = "ses-bounces-${var.environment}"
    Environment = var.environment
    Purpose     = "SES bounce notifications"
  }
}

# SNS Topic for Complaints
resource "aws_sns_topic" "ses_complaints" {
  name = "ses-complaints-${var.environment}"

  tags = {
    Name        = "ses-complaints-${var.environment}"
    Environment = var.environment
    Purpose     = "SES complaint notifications"
  }
}

# IAM Role for Lambda function to process SES notifications
resource "aws_iam_role" "ses_notifications_lambda" {
  name = "ses-notifications-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "ses-notifications-lambda-role-${var.environment}"
    Environment = var.environment
  }
}

# IAM Policy for Lambda to write to CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.ses_notifications_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM Policy for Lambda to publish to SNS (for alerts if needed)
resource "aws_iam_role_policy" "lambda_sns_publish" {
  name = "ses-notifications-lambda-sns-policy-${var.environment}"
  role = aws_iam_role.ses_notifications_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.ses_bounces.arn,
          aws_sns_topic.ses_complaints.arn
        ]
      }
    ]
  })
}

# Lambda function to process bounce notifications
resource "aws_lambda_function" "ses_bounce_handler" {
  function_name = "ses-bounce-handler-${var.environment}"
  runtime       = "python3.12"
  handler       = "lambda_function.lambda_handler"
  role          = aws_iam_role.ses_notifications_lambda.arn

  filename         = data.archive_file.ses_notifications_lambda_zip.output_path
  source_code_hash = data.archive_file.ses_notifications_lambda_zip.output_base64sha256

  timeout     = 30
  memory_size = 128

  environment {
    variables = {
      ENVIRONMENT       = var.environment
      NOTIFICATION_TYPE = "Bounce"
    }
  }

  tags = {
    Name        = "ses-bounce-handler-${var.environment}"
    Environment = var.environment
    Purpose     = "Process SES bounce notifications"
  }
}

# Lambda function to process complaint notifications
resource "aws_lambda_function" "ses_complaint_handler" {
  function_name = "ses-complaint-handler-${var.environment}"
  runtime       = "python3.12"
  handler       = "lambda_function.lambda_handler"
  role          = aws_iam_role.ses_notifications_lambda.arn

  filename         = data.archive_file.ses_notifications_lambda_zip.output_path
  source_code_hash = data.archive_file.ses_notifications_lambda_zip.output_base64sha256

  timeout     = 30
  memory_size = 128

  environment {
    variables = {
      ENVIRONMENT       = var.environment
      NOTIFICATION_TYPE = "Complaint"
    }
  }

  tags = {
    Name        = "ses-complaint-handler-${var.environment}"
    Environment = var.environment
    Purpose     = "Process SES complaint notifications"
  }
}

# Archive Lambda function code
data "archive_file" "ses_notifications_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/ses-notifications-lambda.zip"
}

# SNS Subscription: Bounces -> Lambda
resource "aws_sns_topic_subscription" "bounce_to_lambda" {
  topic_arn = aws_sns_topic.ses_bounces.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.ses_bounce_handler.arn
}

# SNS Subscription: Complaints -> Lambda
resource "aws_sns_topic_subscription" "complaint_to_lambda" {
  topic_arn = aws_sns_topic.ses_complaints.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.ses_complaint_handler.arn
}

# Lambda Permission: Allow SNS to invoke bounce handler
resource "aws_lambda_permission" "allow_sns_bounce" {
  statement_id  = "AllowExecutionFromSNSBounce"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ses_bounce_handler.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.ses_bounces.arn
}

# Lambda Permission: Allow SNS to invoke complaint handler
resource "aws_lambda_permission" "allow_sns_complaint" {
  statement_id  = "AllowExecutionFromSNSComplaint"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ses_complaint_handler.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.ses_complaints.arn
}

# CloudWatch Log Group for bounce handler
resource "aws_cloudwatch_log_group" "bounce_handler_logs" {
  name              = "/aws/lambda/ses-bounce-handler-${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "ses-bounce-handler-logs-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Log Group for complaint handler
resource "aws_cloudwatch_log_group" "complaint_handler_logs" {
  name              = "/aws/lambda/ses-complaint-handler-${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "ses-complaint-handler-logs-${var.environment}"
    Environment = var.environment
  }
}


