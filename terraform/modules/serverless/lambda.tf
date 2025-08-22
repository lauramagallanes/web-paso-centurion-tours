# Lambda Functions Configuration

# Security Group for Lambda functions
resource "aws_security_group" "lambda" {
  name        = "tinambu-lambda-sg-${var.environment}"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  # Outbound to RDS
  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  # Outbound to VPC endpoints and NAT Instance (HTTPS)
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tinambu-lambda-sg-${var.environment}"
  }
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "tinambu-lambda-execution-role-${var.environment}"

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
}

# Lambda basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda VPC execution policy
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda custom policy for SSM and S3 access
resource "aws_iam_role_policy" "lambda_custom" {
  name = "tinambu-lambda-custom-policy-${var.environment}"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = [
          "arn:aws:ssm:${var.region}:*:parameter/${var.environment}/database/*",
          "arn:aws:ssm:${var.region}:*:parameter/${var.environment}/app/*",
          "arn:aws:ssm:${var.region}:*:parameter/${var.environment}/payment/placetopay/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_public_assets_bucket}/*"
        ]
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "backend_api" {
  function_name = "${var.project_name}-backend-${var.environment}"

  # Java 17 Runtime with SnapStart
  runtime = "java17"
  handler = "com.tinambu.tours.lambda.SpringBootLambdaHandler"

  # ZIP packaging from S3 (for large JARs)
  s3_bucket = var.s3_public_assets_bucket
  s3_key    = "lambda/tinambu-tours-lambda-spring.jar"

  # Java requires more memory
  memory_size = 1024 # Start with 1024MB, can increase to 1536MB if needed
  timeout     = 30

  # Publish versions for SnapStart
  publish = true

  # SnapStart for improved cold start performance
  snap_start {
    apply_on = "PublishedVersions"
  }

  # Reserved concurrency for production (low setting)
  # For dev, don't reserve concurrency to avoid account limits
  reserved_concurrent_executions = var.environment == "prod" ? 10 : null

  # IAM Role
  role = aws_iam_role.lambda_execution.arn

  # VPC Configuration for RDS access
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  # Environment variables from SSM Parameter Store
  environment {
    variables = {
      SPRING_PROFILES_ACTIVE  = "lambda"
      APP_REGION              = var.region
      ENVIRONMENT             = var.environment
      S3_PUBLIC_ASSETS_BUCKET = var.s3_public_assets_bucket
      DB_HOST                 = var.db_endpoint
      DB_PORT                 = "5432"
      DB_NAME                 = var.db_name
      DB_USER                 = var.db_user
      # SSM Parameter names (Lambda reads these at runtime)
      SSM_DB_PASSWORD = "/${var.environment}/database/password"
      SSM_JWT_SECRET  = "/${var.environment}/app/jwt_secret"
      # PlacetoPay Payment Links Configuration
      P2P_BASE_URL         = var.environment == "prod" ? "https://checkout.placetopay.com" : "https://checkout-test.placetopay.com"
      P2P_RETURN_URL       = "https://${var.domain_name}/pagos/resultado"
      P2P_NOTIFICATION_URL = "https://${var.api_domain_name}/pagos/links/webhook"
      P2P_INTEGRATION_MODE = var.enable_advanced_payment_integration ? "advanced" : "simple"
      SSM_P2P_LOGIN        = "/${var.environment}/payment/placetopay/login"
      SSM_P2P_SECRET_KEY   = "/${var.environment}/payment/placetopay/secret_key"
    }
  }

  tags = {
    Name = "${var.project_name}-backend-${var.environment}"
  }
}

