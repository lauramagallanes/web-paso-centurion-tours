# Terraform Infrastructure - Tinambú Paso Centurión Tours

## Overview

This Terraform configuration implements a serverless AWS infrastructure for the Tinambú Tours application with cost optimization and security best practices.

## Architecture

- **Compute**: AWS Lambda (Java 17 + SnapStart) + API Gateway HTTP API
- **Database**: RDS PostgreSQL (Single-AZ) with hardened security
- **Networking**: VPC + NAT Instance t4g.nano (cost-effective) + optional VPC Endpoints
- **Storage**: S3 buckets with CloudFront (to be implemented)
- **Security**: IAM, Security Groups, CloudTrail, optional GuardDuty/Config/WAF

## Directory Structure

```
terraform/
├── shared/
│   ├── backend.tf          # Terraform state backend
│   └── versions.tf         # Provider versions
├── modules/
│   ├── database/           # RDS PostgreSQL configuration
│   ├── networking/         # VPC, NAT Instance, VPC Endpoints
│   ├── serverless/         # Lambda + API Gateway
│   ├── storage/            # S3 buckets including CloudFront logs
│   ├── security/           # CloudTrail, GuardDuty (optional), Config (optional)
│   ├── dns/                # DNS and SSL certificate documentation
│   └── outputs.tf          # Main infrastructure outputs
└── environments/
    ├── dev/                # Development environment
    ├── staging/            # Staging environment
    └── prod/               # Production environment
```

## Cost Optimization Features

All optional services are **disabled by default** to maintain minimum costs:

- `enable_interface_endpoints = false` (saves ~$44/month for SSM+KMS)
- `enable_guardduty = false` (saves ~$3-5/month)
- `enable_config = false` (saves ~$2-4/month)
- `enable_waf = false` (saves ~$5-10/month)

### Base Monthly Costs (Minimal Configuration)
- NAT Instance t4g.nano: ~$3.50
- Elastic IP: ~$3.60
- RDS t4g.micro: ~$15-20
- Lambda: Pay-per-use (very low with SnapStart)
- CloudTrail: ~$2 (first 250k events free)
- S3 + storage: ~$5-10
- **Total: ~$30-45/month**

## Deployment

### Prerequisites
1. AWS CLI configured
2. Terraform >= 1.5 installed
3. Lambda ZIP package built

### Deploy Development Environment
```bash
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

### Deploy with Optional Services (Production)
```bash
cd terraform/environments/prod
terraform apply -var="enable_guardduty=true" -var="enable_config=true"
```

## Key Features

### Security
- RDS in private subnets only
- Lambda security groups with minimal permissions
- NAT Instance hardened (no SSH, SSM Session Manager only)
- CloudTrail enabled for audit logging
- S3 Block Public Access enabled

### Performance
- Lambda Java 17 with SnapStart for faster cold starts
- Reserved concurrency (10 in prod, 2 in dev/staging)
- VPC Endpoints available for private AWS service access

### Monitoring
- CloudWatch logs for API Gateway and Lambda
- Auto-recovery for NAT Instance
- Cost monitoring with AWS Budgets (to be implemented)

## PlacetoPay Integration

The infrastructure supports PlacetoPay Payment Links with:
- Webhook endpoint: `POST /pagos/links/webhook`
- Status query: `GET /pagos/links/estado`
- Optional link creation: `POST /pagos/links/crear` (advanced mode)

## Validation

Run validation in each module:
```bash
# Validate all modules
find terraform/modules -name "*.tf" -execdir terraform validate \;

# Validate environments
cd terraform/environments/dev && terraform validate
cd terraform/environments/staging && terraform validate  
cd terraform/environments/prod && terraform validate
```

## Important Notes

### SSL Certificates (ACM)
- **CloudFront**: Certificate must be in `us-east-1`
- **API Gateway**: Certificate must be in same region as API
- See `terraform/modules/dns/README.md` for details

### NAT Instance
- Uses Amazon Linux 2 ARM64 for cost efficiency
- Configured with proper iptables forwarding rules
- Auto-recovery enabled via CloudWatch alarm

### Database
- Single-AZ by default (can upgrade to Multi-AZ)
- Deletion protection enabled in production
- Encrypted at rest with automated backups

