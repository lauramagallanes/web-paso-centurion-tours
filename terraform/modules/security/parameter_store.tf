# SSM Parameter Store Configuration

# JWT Secret
resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.environment}/app/jwt_secret"
  type  = "SecureString"
  value = "CHANGE_ME_${random_password.jwt_secret.result}"

  tags = {
    Environment = var.environment
    Service     = "app"
  }
}

resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}

# PlacetoPay Payment Links Configuration
resource "aws_ssm_parameter" "placetopay_login" {
  name  = "/${var.environment}/payment/placetopay/login"
  type  = "SecureString"
  value = "PLACEHOLDER_P2P_LOGIN_${var.environment}"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Environment = var.environment
    Service     = "payment"
  }
}

resource "aws_ssm_parameter" "placetopay_secret_key" {
  name  = "/${var.environment}/payment/placetopay/secret_key"
  type  = "SecureString"
  value = "PLACEHOLDER_P2P_SECRET_KEY_${var.environment}"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Environment = var.environment
    Service     = "payment"
  }
}

resource "aws_ssm_parameter" "placetopay_base_url" {
  name  = "/${var.environment}/payment/placetopay/base_url"
  type  = "String"
  value = var.environment == "prod" ? "https://checkout.placetopay.com" : "https://checkout-test.placetopay.com"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Environment = var.environment
    Service     = "payment"
  }
}

# Application Configuration Parameters
resource "aws_ssm_parameter" "app_environment" {
  name  = "/${var.environment}/app/environment"
  type  = "String"
  value = var.environment

  tags = {
    Environment = var.environment
    Service     = "app"
  }
}

resource "aws_ssm_parameter" "app_log_level" {
  name  = "/${var.environment}/app/log_level"
  type  = "String"
  value = var.environment == "prod" ? "INFO" : "DEBUG"

  tags = {
    Environment = var.environment
    Service     = "app"
  }
}

