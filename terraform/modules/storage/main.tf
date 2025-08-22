# S3 Buckets Configuration

# Frontend bucket
resource "aws_s3_bucket" "frontend" {
  bucket        = "tinambu-frontend-${var.environment}"
  force_destroy = var.environment != "prod"

  tags = {
    Name = "tinambu-frontend-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Public assets bucket
resource "aws_s3_bucket" "public_assets" {
  bucket        = "tinambu-public-assets-${var.environment}"
  force_destroy = var.environment != "prod"

  tags = {
    Name = "tinambu-public-assets-${var.environment}"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Private backups bucket
resource "aws_s3_bucket" "private_backups" {
  bucket        = "tinambu-private-backups-${var.environment}"
  force_destroy = false

  tags = {
    Name = "tinambu-private-backups-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "private_backups" {
  bucket = aws_s3_bucket.private_backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "private_backups" {
  bucket = aws_s3_bucket.private_backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access for all buckets
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "private_backups" {
  bucket = aws_s3_bucket.private_backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

