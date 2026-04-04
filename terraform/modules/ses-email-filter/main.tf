terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ─── SSM Parameter: Email Blocklist ───────────────────────────────────────────
# Stores a comma-separated list of blocked addresses and/or domains.
# Examples:
#   spam@evil.com,phishing@fraud.net,@entire-spam-domain.com
#
# IMPORTANT: After the first apply, update this value directly in AWS Console or
# with the AWS CLI — Terraform will not overwrite it (lifecycle ignore_changes).
#   aws ssm put-parameter --name "/<env>/ses/email_blocklist" \
#     --value "spam@evil.com,@bad-domain.com" --overwrite

resource "aws_ssm_parameter" "email_blocklist" {
  name        = "/${var.environment}/ses/email_blocklist"
  type        = "String"
  value       = var.initial_blocklist
  description = "Comma-separated blocklist for SES inbound filter (emails and/or @domains)"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name        = "ses-email-blocklist-${var.environment}"
    Environment = var.environment
    Purpose     = "SES inbound email blocklist"
  }
}

# ─── IAM Role for Filter Lambda ───────────────────────────────────────────────

resource "aws_iam_role" "email_filter_lambda" {
  name = "email-filter-lambda-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Name        = "email-filter-lambda-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "email_filter_lambda" {
  name = "email-filter-lambda-policy-${var.environment}"
  role = aws_iam_role.email_filter_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "CloudWatchLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Sid      = "ReadBlocklist"
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.environment}/ses/email_blocklist"
      }
    ]
  })
}

# ─── Filter Lambda Function ────────────────────────────────────────────────────

data "archive_file" "filter_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_filter.py"
  output_path = "${path.module}/lambda_filter.zip"
}

resource "aws_lambda_function" "email_filter" {
  function_name    = "email-filter-${var.environment}"
  handler          = "lambda_filter.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.filter_lambda_zip.output_path
  source_code_hash = data.archive_file.filter_lambda_zip.output_base64sha256
  role             = aws_iam_role.email_filter_lambda.arn
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      BLOCKLIST_SSM_PARAM = "/${var.environment}/ses/email_blocklist"
      ENVIRONMENT         = var.environment
    }
  }

  tags = {
    Name        = "email-filter-${var.environment}"
    Environment = var.environment
    Purpose     = "SES inbound email filter"
  }
}

# Allow SES to invoke this Lambda synchronously
resource "aws_lambda_permission" "ses_invoke_filter" {
  statement_id   = "AllowSESInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.email_filter.function_name
  principal      = "ses.amazonaws.com"
  source_account = data.aws_caller_identity.current.account_id
}

resource "aws_cloudwatch_log_group" "email_filter_lambda" {
  name              = "/aws/lambda/email-filter-${var.environment}"
  retention_in_days = 7

  tags = {
    Name        = "email-filter-lambda-logs-${var.environment}"
    Environment = var.environment
  }
}

# ─── Option 1: SES IP Address Filters ─────────────────────────────────────────
# Global account-level filters applied BEFORE any receipt rules.
# Pass a map of { label = "cidr" } via var.blocked_ip_ranges.
# Example: { "known-spammer-1" = "203.0.113.0/24" }

resource "aws_ses_receipt_filter" "blocked_ips" {
  for_each = var.blocked_ip_ranges

  name   = "block-${each.key}-${var.environment}"
  cidr   = each.value
  policy = "Block"
}

# ─── Option 3: SES Receipt Rule Set + Rules ────────────────────────────────────
# MIGRATION NOTE: This creates and activates a new receipt rule set.
# Any existing manually-configured rules in the AWS Console will be in a
# different (now inactive) rule set. Before applying, note your existing rules
# so the store-to-s3 rule below matches your current S3 bucket/prefix setup.

resource "aws_ses_receipt_rule_set" "main" {
  rule_set_name = "inbound-rules-${var.environment}"
}

resource "aws_ses_active_receipt_rule_set" "main" {
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
}

# Rule 1 — Filter (Lambda, RequestResponse)
# SES invokes this Lambda synchronously before storing anything.
# scan_enabled = true activates SES's built-in spam & virus scanning at no cost.
# The verdicts are available inside the Lambda event (receipt.spamVerdict, etc.).

resource "aws_ses_receipt_rule" "email_filter" {
  name          = "email-filter-${var.environment}"
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
  enabled       = true
  scan_enabled  = true

  lambda_action {
    function_arn    = aws_lambda_function.email_filter.arn
    invocation_type = "RequestResponse"
    position        = 1
  }

  depends_on = [aws_lambda_permission.ses_invoke_filter]
}

# Rule 2..N — Store to S3 per recipient (only reached if Rule 1 returns CONTINUE)
# Recreates the existing manually-configured rules: one per address/prefix pair.
# All rules point after the filter rule; since each targets different recipients,
# their relative order among themselves does not matter.

resource "aws_ses_receipt_rule" "store_to_s3" {
  for_each = { for r in var.s3_rules : r.name => r }

  name          = "store-${each.key}-to-s3-${var.environment}"
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
  after         = aws_ses_receipt_rule.email_filter.name
  recipients    = each.value.recipients
  enabled       = true

  s3_action {
    bucket_name       = var.inbound_email_bucket
    object_key_prefix = each.value.prefix
    iam_role_arn      = var.s3_action_iam_role_arn != "" ? var.s3_action_iam_role_arn : null
    position          = 1
  }
}
