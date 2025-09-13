# Environment Setup Guide - Tinambu Tours

## 🔐 Required Environment Variables

This file contains the template for environment variables needed for deployment. 
**NEVER commit actual credentials to version control.**

### For Development Team - Set These Values:

```bash
# AWS Configuration
AWS_PROFILE=your-aws-profile-name

# Frontend S3 Bucket
FRONTEND_BUCKET=your-frontend-bucket-name

# Backend Lambda Configuration
LAMBDA_FUNCTION_NAME=your-lambda-function-name
ASSETS_BUCKET=your-assets-bucket-name

# API Gateway Configuration
API_GATEWAY_ID=your-api-gateway-id
INTEGRATION_ID=your-integration-id

# Database Configuration (Lambda Environment Variables)
DB_HOST=your-rds-endpoint.amazonaws.com
DB_NAME=your-database-name
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password
JWT_SECRET=your-jwt-secret-key-256-bits

# AWS Network Configuration
LAMBDA_VPC_ID=vpc-xxxxxxxxx
LAMBDA_SUBNET_1=subnet-xxxxxxxxx
LAMBDA_SUBNET_2=subnet-xxxxxxxxx
LAMBDA_SECURITY_GROUP=sg-xxxxxxxxx
```

### Admin User Configuration

The system requires an admin user to be pre-configured in the database:
- Create admin user with ADMINISTRADOR role
- Set email and password (do not commit these values)
- Grant necessary permissions for admin panel access

### Quick Start Commands

Replace placeholders with actual values:

```bash
# Deploy frontend
aws s3 sync dist/ s3://[FRONTEND_BUCKET] --delete --region us-east-1 --profile [AWS_PROFILE]

# Deploy backend
AWS_PROFILE=[AWS_PROFILE] aws lambda update-function-code \
  --function-name [LAMBDA_FUNCTION_NAME] \
  --s3-bucket [ASSETS_BUCKET] \
  --s3-key lambda/tinambu-tours-lambda.jar \
  --region us-east-1

# Add API Gateway route
AWS_PROFILE=[AWS_PROFILE] aws apigatewayv2 create-route \
  --api-id [API_GATEWAY_ID] \
  --route-key "GET /your-endpoint" \
  --target "integrations/[INTEGRATION_ID]" \
  --authorization-type NONE \
  --region us-east-1
```

## 🚀 Application URLs (After Setup)

- **Frontend:** https://[FRONTEND_BUCKET].s3.us-east-1.amazonaws.com/
- **Admin Panel:** https://[FRONTEND_BUCKET].s3.us-east-1.amazonaws.com/admin
- **API Base:** https://[API_GATEWAY_ID].execute-api.us-east-1.amazonaws.com

## 📋 Security Checklist

- ✅ Database credentials stored only in Lambda environment variables
- ✅ Admin credentials not committed to repository  
- ✅ JWT secret is properly randomized (256+ bits)
- ✅ AWS resource IDs not exposed in documentation
- ✅ VPC configuration restricts database access
- ✅ API Gateway configured with proper CORS

## 🔧 Local Development

For local development, create a `.env.local` file with the required variables.
This file should be added to `.gitignore` to prevent accidental commits.

## 📞 Getting Actual Values

Contact the development team lead for:
- Admin panel credentials
- AWS resource identifiers  
- Database connection details
- Environment-specific configuration
