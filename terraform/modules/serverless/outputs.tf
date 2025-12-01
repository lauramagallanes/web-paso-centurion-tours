# Serverless Module Outputs
output "lambda_function_arn" {
  value       = aws_lambda_function.backend_api.arn
  description = "Lambda function ARN"
}

output "lambda_function_name" {
  value       = aws_lambda_function.backend_api.function_name
  description = "Lambda function name"
}

# lambda_security_group_id output removed - Lambda runs without VPC

output "api_gateway_id" {
  value       = aws_apigatewayv2_api.main.id
  description = "API Gateway ID"
}

output "api_gateway_endpoint" {
  value       = aws_apigatewayv2_api.main.api_endpoint
  description = "API Gateway endpoint URL"
}

output "api_base_url" {
  value       = aws_apigatewayv2_api.main.api_endpoint
  description = "API Gateway base URL"
}

output "payment_webhook_url" {
  value       = "${aws_apigatewayv2_api.main.api_endpoint}/pagos/links/webhook"
  description = "PlacetoPay webhook URL"
}

output "payment_status_endpoint" {
  value       = "${aws_apigatewayv2_api.main.api_endpoint}/pagos/links/estado"
  description = "Payment status query endpoint"
}

output "payment_create_endpoint" {
  value       = var.enable_advanced_payment_integration ? "${aws_apigatewayv2_api.main.api_endpoint}/pagos/links/crear" : null
  description = "Payment link creation endpoint (Advanced mode only)"
}

