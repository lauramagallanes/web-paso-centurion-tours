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

resource "aws_apigatewayv2_route" "senderos_admin_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/admin"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_create" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /senderos/admin"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_update" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /senderos/admin/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /senderos/admin/{id}"
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

resource "aws_apigatewayv2_route" "guias_admin_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /guias/admin"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "guias_admin_create" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /guias/admin"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "guias_admin_update" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /guias/admin/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "guias_admin_delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /guias/admin/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "guias_admin_estado" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /guias/admin/{id}/estado"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_disp_guias_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/admin/disponibilidad/{disponibilidadId}/guias"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_disp_guia_assign" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /senderos/admin/disponibilidad/{disponibilidadId}/guias/{guiaId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_disp_guia_unassign" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /senderos/admin/disponibilidad/{disponibilidadId}/guias/{guiaId}"
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

resource "aws_apigatewayv2_route" "images_alojamiento_set_main" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /images/alojamientos/{id}/principal"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "images_update_order" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /images/senderos/{id}/orden"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# ========== ALOJAMIENTOS ROUTES ==========

resource "aws_apigatewayv2_route" "alojamientos_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /alojamientos"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /alojamientos/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_verify_availability" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /alojamientos/{id}/verificar-disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_blocked_dates" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /alojamientos/{id}/fechas-bloqueadas"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_carrito_bloqueo_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /alojamientos/{id}/carrito-bloqueo"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_carrito_bloqueo_delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /alojamientos/{id}/carrito-bloqueo"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_carrito_bloqueos_delete_all" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /alojamientos/carrito/bloqueos"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Admin reservation state management routes
resource "aws_apigatewayv2_route" "reservas_update_estado_alojamiento" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/estado-alojamiento"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_update_estado_sendero" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/estado-sendero"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_update_estado_pago_alojamiento" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/estado-pago-alojamiento"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_update_estado_pago_sendero" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/estado-pago-sendero"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_posponer_sendero" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/posponer-sendero"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_posponer_alojamiento" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/posponer-alojamiento"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_admin_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /alojamientos/admin"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_admin_create" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /alojamientos/admin"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_update" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /alojamientos/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /alojamientos/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_list_availability" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /alojamientos/{id}/disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_add_availability" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /alojamientos/{id}/disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_delete_availability" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /alojamientos/{id}/disponibilidad/{disponibilidadId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_list_bloqueos" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /alojamientos/{id}/bloqueos-manuales"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_create_bloqueo" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /alojamientos/{id}/bloqueos-manuales"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "alojamientos_delete_bloqueo" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /alojamientos/{id}/bloqueos-manuales"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# ========== NEW RESERVAS ROUTES (Sendero & Alojamiento) ==========

resource "aws_apigatewayv2_route" "reservas_create_sendero" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /reservas/sendero"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_sendero_disponibilidad" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/sendero/disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_create_alojamiento" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /reservas/alojamiento"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Admin-side manual booking endpoints (walk-in / phone reservations).
resource "aws_apigatewayv2_route" "reservas_admin_create_sendero" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /reservas/admin/sendero"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_admin_create_alojamiento" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /reservas/admin/alojamiento"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_sendero_by_code" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/sendero/codigo/{codigo}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_sendero_by_email" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/sendero/email/{email}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_alojamiento_by_email" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/alojamiento/email/{email}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_confirm_sendero" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/confirmar-sendero"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_confirm_alojamiento" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/confirmar-alojamiento"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_cancel_sendero" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/cancelar-sendero"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_cancel_alojamiento" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/admin/{id}/cancelar-alojamiento"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_admin_senderos" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/admin/senderos"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_admin_alojamientos" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/admin/alojamientos"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_admin_sendero_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/admin/sendero/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "reservas_admin_alojamiento_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /reservas/admin/alojamiento/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# ========== PLACETOPAY PAYMENT SESSION ROUTES ==========

resource "aws_apigatewayv2_route" "pagos_crear_sesion" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /pagos/crear-sesion"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "pagos_estado" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /pagos/estado/{reservaId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "pagos_webhook" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /pagos/webhook"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "pagos_estado_orden" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /pagos/estado/orden/{ordenId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# ========== CHECKOUT ROUTES ==========

resource "aws_apigatewayv2_route" "checkout_orden" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /checkout/orden"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "checkout_orden_pendientes" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /checkout/orden-pendientes"
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

# =============================================================================
# Senderos: gestión de disponibilidad y bloqueos (admin) + bloqueos (público)
# =============================================================================

resource "aws_apigatewayv2_route" "senderos_public_bloqueos" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/{id}/bloqueos"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_list_disponibilidad" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/admin/{id}/disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_create_disponibilidad" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /senderos/admin/{id}/disponibilidad"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_update_disponibilidad" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /senderos/admin/disponibilidad/{disponibilidadId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_delete_disponibilidad" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /senderos/admin/disponibilidad/{disponibilidadId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_list_bloqueos" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /senderos/admin/{id}/bloqueos"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_create_bloqueo" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /senderos/admin/{id}/bloqueos"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "senderos_admin_delete_bloqueo" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /senderos/admin/bloqueos/{bloqueoId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# ========== CART HOLD REVALIDATION ==========
# Revalida si el usuario autenticado tiene bloqueo de carrito vigente para
# las fechas indicadas (fuente de verdad para limpiar items "fantasma").
resource "aws_apigatewayv2_route" "alojamientos_carrito_bloqueo_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /alojamientos/{id}/carrito-bloqueo"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# ========== CANCELACIÓN DE PAGO ABANDONADO ==========
# Cancela una orden de compra pendiente cuando el usuario abandona la pasarela
# (libera todos los bloqueos de fechas de las reservas asociadas).
resource "aws_apigatewayv2_route" "pagos_orden_cancelar" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /pagos/orden/{ordenId}/cancelar"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Cancela una reserva pendiente individual cuando el cancelUrl viene con
# reservaId+tipo en lugar de ordenId.
resource "aws_apigatewayv2_route" "pagos_reserva_cancelar" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /pagos/reserva/{reservaId}/cancelar"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# ========== CANCELACIÓN POR USUARIO (Mis Reservas) ==========
# El titular puede solicitar cancelar su reserva desde "Mis reservas".
# No hay reembolso (regla de negocio); el reagendamiento se coordina con el operador.
resource "aws_apigatewayv2_route" "reservas_usuario_cancelar" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /reservas/usuario/{id}/cancelar"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

