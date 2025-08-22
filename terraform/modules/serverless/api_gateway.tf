# API Gateway HTTP API Configuration

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "tinambu-api-${var.environment}"
  protocol_type = "HTTP"
  description   = "Tinambu Tours API - ${var.environment}"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "authorization"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    expose_headers    = ["date", "keep-alive"]
    max_age           = 86400
  }

  tags = {
    Name = "tinambu-api-${var.environment}"
  }
}

# Lambda Integration
resource "aws_apigatewayv2_integration" "lambda" {
  api_id               = aws_apigatewayv2_api.main.id
  integration_type     = "AWS_PROXY"
  integration_method   = "POST"
  # Use $LATEST instead of published version to avoid SnapStart cache issues
  integration_uri      = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.backend_api.arn}/invocations"
  
  # Crucial: Set payload format version for API Gateway v2
  payload_format_version = "2.0"
}

# Default route removed - using specific routes only
# resource "aws_apigatewayv2_route" "default" {
#   api_id    = aws_apigatewayv2_api.main.id
#   route_key = "$default"
#   target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
# }

# Test Routes
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "health_info" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health/info"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "test" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /test"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "ping" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /ping"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "basic" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /basic"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "simple" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /simple"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Database Test Routes
resource "aws_apigatewayv2_route" "database_test" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /database/test"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "database_info" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /database/info"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Authentication Test Routes
resource "aws_apigatewayv2_route" "auth_login" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth/login"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "auth_signup" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth/signup"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "auth_validate" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /auth/validate"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "auth_info" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /auth/info"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# PlacetoPay Payment Links Routes
resource "aws_apigatewayv2_route" "payment_webhook" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /pagos/links/webhook"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "payment_status" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /pagos/links/estado"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Optional advanced integration route
resource "aws_apigatewayv2_route" "payment_create_link" {
  count = var.enable_advanced_payment_integration ? 1 : 0

  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /pagos/links/crear"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# API Gateway Stage with access logging
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw.arn
    format = jsonencode({
      requestId          = "$context.requestId"
      httpMethod         = "$context.httpMethod"
      routeKey           = "$context.routeKey"
      status             = "$context.status"
      integrationStatus  = "$context.integrationStatus"
      integrationLatency = "$context.integrationLatency"
      responseLatency    = "$context.responseLatency"
      ip                 = "$context.identity.sourceIp"
      userAgent          = "$context.identity.userAgent"
    })
  }

  tags = {
    Name = "tinambu-api-stage-${var.environment}"
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "apigw" {
  name              = "/aws/apigw/${var.project_name}-${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = {
    Name = "tinambu-apigw-logs-${var.environment}"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

