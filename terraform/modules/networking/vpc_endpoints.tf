# VPC Endpoints Configuration

# S3 Gateway Endpoint (FREE - always enabled)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.region}.s3"

  route_table_ids = aws_route_table.private[*].id

  tags = {
    Name = "tinambu-s3-gateway-endpoint-${var.environment}"
  }
}

# Security Group for VPC Endpoints (conditional)
resource "aws_security_group" "vpc_endpoints" {
  count = var.enable_interface_endpoints ? 1 : 0

  name        = "tinambu-vpc-endpoints-sg-${var.environment}"
  description = "VPC Endpoints security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = var.lambda_security_group_id != "" ? [var.lambda_security_group_id] : []
  }

  tags = {
    Name = "tinambu-vpc-endpoints-sg-${var.environment}"
  }
}

# SSM Interface Endpoint (optional for cost control)
resource "aws_vpc_endpoint" "ssm" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${var.region}.ssm"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = [aws_subnet.private[0].id] # Single AZ for cost optimization
  security_group_ids = [aws_security_group.vpc_endpoints[0].id]

  private_dns_enabled = true

  tags = {
    Name = "tinambu-ssm-interface-endpoint-${var.environment}"
  }
}

# KMS Interface Endpoint (optional for SecureString decryption)
resource "aws_vpc_endpoint" "kms" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${var.region}.kms"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = [aws_subnet.private[0].id] # Single AZ for cost optimization
  security_group_ids = [aws_security_group.vpc_endpoints[0].id]

  private_dns_enabled = true

  tags = {
    Name = "tinambu-kms-interface-endpoint-${var.environment}"
  }
}

