# DNS and SSL Certificate Configuration

## Important: ACM Certificate Regions

### CloudFront Certificate
- **Region Required**: `us-east-1` (North Virginia)
- **Reason**: CloudFront is a global service that requires certificates to be in us-east-1
- **Usage**: Frontend distribution (React app)

### API Gateway Certificate  
- **Region Required**: Same region as the API Gateway
- **Reason**: Regional API Gateway services require certificates in the same region
- **Usage**: Backend API endpoints

## Configuration Example

```hcl
# Certificate for CloudFront (must be in us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_acm_certificate" "cloudfront" {
  provider    = aws.us_east_1
  domain_name = var.domain_name
  
  validation_method = "DNS"
  
  tags = {
    Name = "tinambu-cloudfront-cert-${var.environment}"
  }
}

# Certificate for API Gateway (same region as API)
resource "aws_acm_certificate" "api_gateway" {
  domain_name = var.api_domain_name
  
  validation_method = "DNS"
  
  tags = {
    Name = "tinambu-api-cert-${var.environment}"
  }
}
```

## DNS Records

Both certificates will require DNS validation records to be created in your DNS provider (Route 53 or external).

## Implementation Notes

1. Create CloudFront certificate first in us-east-1
2. Create API Gateway certificate in your target region
3. Validate both certificates through DNS
4. Reference certificates in CloudFront and API Gateway configurations

