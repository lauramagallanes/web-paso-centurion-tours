# Security Services Configuration

# CloudTrail (always enabled - basic cost)
resource "aws_cloudtrail" "main" {
  name           = "tinambu-cloudtrail-${var.environment}"
  s3_bucket_name = aws_s3_bucket.cloudtrail.id

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []
  }

  tags = {
    Name = "tinambu-cloudtrail-${var.environment}"
  }
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "tinambu-cloudtrail-${var.environment}"
  force_destroy = var.environment != "prod"

  tags = {
    Name = "tinambu-cloudtrail-${var.environment}"
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# GuardDuty (conditional - prod only by default)
resource "aws_guardduty_detector" "main" {
  count = var.environment == "prod" && var.enable_guardduty ? 1 : 0

  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = {
    Name = "tinambu-guardduty-${var.environment}"
  }
}

# AWS Config (conditional - prod only by default)
resource "aws_config_configuration_recorder" "main" {
  count = var.environment == "prod" && var.enable_config ? 1 : 0

  name     = "tinambu-config-recorder-${var.environment}"
  role_arn = aws_iam_role.config[0].arn

  recording_group {
    all_supported = true
  }
}

resource "aws_iam_role" "config" {
  count = var.environment == "prod" && var.enable_config ? 1 : 0

  name = "tinambu-config-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  count = var.environment == "prod" && var.enable_config ? 1 : 0

  role       = aws_iam_role.config[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

