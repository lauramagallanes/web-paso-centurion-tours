terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Crear archivo ZIP para Lambda
# Usar lambda_function.py (S3 Events - solución simple)
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda.zip"
}

# Rol IAM para Lambda
resource "aws_iam_role" "email_forwarding_lambda" {
  name = "email-forwarding-lambda-${var.environment}"

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
    Name        = "email-forwarding-lambda-${var.environment}"
    Environment = var.environment
  }
}

# Política para Lambda: leer de S3 y enviar con SES
resource "aws_iam_role_policy" "email_forwarding_lambda" {
  name = "email-forwarding-lambda-policy-${var.environment}"
  role = aws_iam_role.email_forwarding_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "arn:aws:s3:::pasocenturion-emails-inbound/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendRawEmail",
          "ses:SendEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# Función Lambda
resource "aws_lambda_function" "email_forwarding" {
  function_name    = "email-forwarding-${var.environment}"
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.email_forwarding_lambda.arn
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      DESTINATION_EMAIL = var.destination_email
      FROM_EMAIL        = var.from_email
      ENVIRONMENT      = var.environment
    }
  }

  tags = {
    Name        = "email-forwarding-${var.environment}"
    Environment = var.environment
  }
}

# Log Group para Lambda
resource "aws_cloudwatch_log_group" "email_forwarding_lambda" {
  name              = "/aws/lambda/email-forwarding-${var.environment}"
  retention_in_days = 7

  tags = {
    Name        = "email-forwarding-lambda-logs-${var.environment}"
    Environment = var.environment
  }
}
