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
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  # Use $LATEST instead of published version to avoid SnapStart cache issues
  integration_uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.backend_api.arn}/invocations"

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

# ========== MAIN APPLICATION ROUTES ==========

# Senderos Routes
resource "aws_apigatewayv2_route" "senderos_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Contact Form Route
resource "aws_apigatewayv2_route" "contacto" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /contacto"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_by_difficulty" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/dificultad/{dificultad}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_calculate_price" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /senderos/{id}/calcular-precio"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_availability" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/{id}/disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_available_guides" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/{id}/guias-disponibles"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_related" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/{id}/relacionados"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_verify_booking" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /senderos/{id}/verificar-disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Habitaciones Routes
resource "aws_apigatewayv2_route" "habitaciones_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /habitaciones"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "habitaciones_available" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /habitaciones/disponibles"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "habitaciones_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /habitaciones/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Guias Routes
resource "aws_apigatewayv2_route" "guias_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /guias"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "guias_available" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /guias/disponibles"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "guias_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /guias/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Reservas Routes
resource "aws_apigatewayv2_route" "reservas_create" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /reservas"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_verify" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /reservas/verificar-disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_calculate" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /reservas/calcular-precio"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_by_code" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/codigo/{codigo}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_by_email" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/email/{email}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Admin Routes
resource "aws_apigatewayv2_route" "reservas_admin_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/admin"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_admin_detailed" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/admin/detalladas"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_admin_stats" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/admin/estadisticas"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_confirm" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/confirmar"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_cancel" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/cancelar"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_update_status" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/{id}/estado"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Payment Routes
resource "aws_apigatewayv2_route" "pagos_register" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /pagos/registrar"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "pagos_history" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /pagos/reserva/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "pagos_pending" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /pagos/pendientes"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Images Routes (S3 alternatives for admin)
resource "aws_apigatewayv2_route" "images_senderos_upload" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /images/senderos/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "images_senderos_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /images/senderos/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "images_delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /images/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "images_set_main" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /images/{id}/principal"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "images_update_order" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /images/senderos/{id}/orden"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Guide Management Routes
resource "aws_apigatewayv2_route" "senderos_assign_guide" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /senderos/{senderoId}/guias/{guiaId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_remove_guide" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /senderos/{senderoId}/guias/{guiaId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_get_guides" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/{senderoId}/guias"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Availability Management Routes
resource "aws_apigatewayv2_route" "senderos_create_availability" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /senderos/{senderoId}/disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_update_availability" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /senderos/{senderoId}/disponibilidad/{disponibilidadId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_delete_availability" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /senderos/{senderoId}/disponibilidad/{disponibilidadId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_get_availabilities" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/{senderoId}/disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_availability_by_date" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/{senderoId}/disponibilidad/fecha/{fecha}"
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

